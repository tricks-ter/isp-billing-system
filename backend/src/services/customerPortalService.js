// backend/src/services/customerPortalService.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');
const oltService = require('./oltService');

class CustomerPortalService {
  /**
   * Customer Login with PPPoE Credentials or Phone Number
   */
  async login(usernameOrPhone, password) {
    if (!usernameOrPhone || !password) {
      throw new Error('PPPoE username and password are required');
    }

    const trimmedIdentifier = usernameOrPhone.trim();
    const trimmedPassword = password.trim();

    // Find customer by pppoeUsername OR phone
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { pppoeUsername: trimmedIdentifier },
          { phone: trimmedIdentifier },
        ],
      },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
      },
    });

    if (!customer) {
      throw new Error('No subscriber found with these credentials. Please check your PPPoE username.');
    }

    // Verify PPPoE password
    if (customer.pppoePassword !== trimmedPassword) {
      throw new Error('Incorrect password. Please verify your PPPoE password or contact ISP helpline.');
    }

    // Sign JWT
    const token = jwt.sign(
      {
        customerId: customer.id,
        pppoeUsername: customer.pppoeUsername,
        phone: customer.phone,
        role: 'CUSTOMER',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: 1,
          action: 'CUSTOMER_PORTAL_LOGIN',
          details: JSON.stringify({ customerId: customer.id, pppoeUsername: customer.pppoeUsername }),
        },
      });
    } catch (_) {}

    return {
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        area: customer.area,
        pppoeUsername: customer.pppoeUsername,
        status: customer.status,
        package: customer.package,
        joinDate: customer.joinDate,
      },
    };
  }

  /**
   * Get Comprehensive Customer Portal Dashboard Data
   */
  async getDashboard(customerId) {
    const id = parseInt(customerId);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer account not found');
    }

    // 1. Live MikroTik Session Data
    let liveSession = {
      isOnline: customer.status === 'ACTIVE',
      uptime: customer.status === 'ACTIVE' ? 'Active Session' : 'Offline',
      ipAddress: customer.status === 'ACTIVE' ? '10.10.1.105 (Dynamic PPPoE)' : 'Not assigned',
      macAddress: 'N/A',
      bytesIn: customer.status === 'ACTIVE' ? 'Connected' : '0 MB',
      bytesOut: customer.status === 'ACTIVE' ? 'Connected' : '0 MB',
    };

    if (customer.router) {
      try {
        const sessions = await mikrotikService.getActiveSessions(customer.router.id);
        const active = sessions.find(s => s.name === customer.pppoeUsername || s.user === customer.pppoeUsername);
        if (active) {
          liveSession = {
            isOnline: true,
            uptime: active.uptime || 'Active',
            ipAddress: active.address || active.ipAddress || '10.10.1.105',
            macAddress: active.callerId || active.macAddress || 'N/A',
            bytesIn: active.bytesIn || 'Connected',
            bytesOut: active.bytesOut || 'Connected',
          };
        }
      } catch (err) {
        console.warn('MikroTik live session query note:', err.message);
      }
    }

    // 2. Live OLT Optical Signal Diagnostics
    let opticalSignal = {
      hasOnu: false,
      rxPower: null,
      txPower: null,
      signalStatus: 'UNKNOWN', // OPTIMAL, GOOD, WARNING, CRITICAL, LOS
      model: 'Standard ONU',
      macAddress: null,
      serialNumber: null,
      portNumber: null,
    };

    if (customer.onu) {
      const rx = customer.onu.rxPower ?? customer.opticalPower;
      let signalStatus = 'GOOD';
      if (rx !== null && rx !== undefined) {
        if (rx >= -24.0 && rx <= -8.0) signalStatus = 'OPTIMAL';
        else if (rx >= -27.0 && rx < -24.0) signalStatus = 'GOOD';
        else if (rx >= -30.0 && rx < -27.0) signalStatus = 'WARNING';
        else signalStatus = 'CRITICAL';
      }

      if (customer.onu.status === 'LOS' || customer.onu.status === 'OFFLINE') {
        signalStatus = 'LOS';
      }

      opticalSignal = {
        hasOnu: true,
        rxPower: rx,
        txPower: customer.onu.txPower || 2.5,
        signalStatus,
        model: customer.onu.model || 'XPON ONU',
        macAddress: customer.onu.macAddress,
        serialNumber: customer.onu.serialNumber,
        portNumber: customer.onu.portNumber,
        status: customer.onu.status,
      };
    }

    // 3. Billing & Invoices Calculation
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalDue = 0;
    let totalPaid = 0;
    let advanceTotal = 0;
    const unpaidInvoices = [];

    customer.invoices.forEach(inv => {
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const due = Math.max(0, inv.total - paid);
      totalPaid += paid;

      const isFutureMonth = inv.month > currentMonth;
      if (isFutureMonth) {
        if (inv.status === 'PAID') advanceTotal += paid;
      } else {
        if (due > 0 || inv.status !== 'PAID') {
          totalDue += due;
        }
      }

      if (due > 0 || inv.status !== 'PAID') {
        unpaidInvoices.push({
          id: inv.id,
          month: inv.month,
          total: inv.total,
          paidAmount: paid,
          dueAmount: due,
          dueDate: inv.dueDate,
          status: inv.status,
          isAdvance: isFutureMonth,
          publicToken: inv.publicToken,
        });
      }
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        area: customer.area,
        pppoeUsername: customer.pppoeUsername,
        status: customer.status,
        collectionNote: customer.collectionNote,
        promisedPayDate: customer.promisedPayDate,
        joinDate: customer.joinDate,
        expireDate: customer.expireDate,
        package: customer.package,
      },
      liveSession,
      opticalSignal,
      billing: {
        totalDue,
        totalPaid,
        advanceTotal,
        currentMonth,
        unpaidInvoices,
        recentInvoices: customer.invoices.slice(0, 5).map(inv => ({
          id: inv.id,
          month: inv.month,
          total: inv.total,
          paidAmount: inv.payments.reduce((sum, p) => sum + p.amount, 0),
          status: inv.status,
          dueDate: inv.dueDate,
          publicToken: inv.publicToken,
        })),
      },
      recentTickets: customer.tickets || [],
    };
  }

  /**
   * Get All Invoices for Customer
   */
  async getInvoices(customerId) {
    const id = parseInt(customerId);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const invoices = await prisma.invoice.findMany({
      where: { customerId: id },
      include: {
        payments: true,
      },
      orderBy: { month: 'desc' },
    });

    return invoices.map(inv => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = Math.max(0, inv.total - paidAmount);
      const isAdvance = inv.month > currentMonth;
      return {
        ...inv,
        paidAmount,
        dueAmount,
        isAdvance,
      };
    });
  }

  /**
   * Get All Payments / Transaction History
   */
  async getPayments(customerId) {
    const id = parseInt(customerId);
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { customerId: id },
      },
      include: {
        invoice: {
          select: { id: true, month: true, total: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return payments;
  }

  /**
   * Get All Support Tickets for Customer
   */
  async getSupportTickets(customerId) {
    const id = parseInt(customerId);
    return await prisma.supportTicket.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create Support Ticket or Service Request
   */
  async createSupportTicket(customerId, data) {
    const id = parseInt(customerId);
    const { subject, category, priority, message } = data;

    if (!subject || !message) {
      throw new Error('Subject and detailed message are required');
    }

    const ticketNo = `TKT-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo,
        customerId: id,
        subject: subject.trim(),
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        message: message.trim(),
      },
    });

    // Notify Admin via Notification model
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
      });
      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `New Support Ticket: ${ticketNo}`,
            message: `Customer created ticket: "${subject}" (${category || 'GENERAL'})`,
            type: priority === 'URGENT' || priority === 'HIGH' ? 'WARNING' : 'INFO',
          },
        });
      }
    } catch (_) {}

    return ticket;
  }

  /**
   * Get Available Packages for Upgrade Requests
   */
  async getAvailablePackages() {
    return await prisma.package.findMany({
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Update Customer Contact Profile
   */
  async updateProfile(customerId, data) {
    const id = parseInt(customerId);
    const { phone, address } = data;

    if (phone) {
      const existingPhone = await prisma.customer.findUnique({ where: { phone } });
      if (existingPhone && existingPhone.id !== id) {
        throw new Error('Phone number is already associated with another account');
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        phone: phone || undefined,
        address: address !== undefined ? address : undefined,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      area: updated.area,
    };
  }

  /**
   * Initiate bKash Payment with Advance Payment & Custom Month Option
   */
  async initiatePayment(customerId, options = {}) {
    const id = parseInt(customerId);
    const { invoiceId, isAdvance, customMonth, customAmount, monthsCount = 1 } = options;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        package: true,
        invoices: {
          include: { payments: true },
          orderBy: { month: 'desc' },
        },
      },
    });

    if (!customer) throw new Error('Customer account not found');

    const bkashService = require('./bkashService');
    let targetInvoice = null;

    if (invoiceId) {
      targetInvoice = customer.invoices.find(i => i.id === parseInt(invoiceId));
      if (!targetInvoice) {
        targetInvoice = await prisma.invoice.findUnique({
          where: { id: parseInt(invoiceId) },
          include: { payments: true },
        });
      }
    }

    // If no specific invoice was requested, or if paying in advance
    if (!targetInvoice) {
      if (!isAdvance) {
        // Look for earliest unpaid invoice
        const unpaid = customer.invoices.slice().reverse().find(inv => {
          const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
          return inv.total > paid;
        });
        if (unpaid) {
          targetInvoice = unpaid;
        }
      }

      // If still no unpaid invoice found, or advance payment requested
      if (!targetInvoice) {
        let targetMonth = customMonth;
        if (!targetMonth) {
          const now = new Date();
          let nextYear = now.getFullYear();
          let nextMonth = now.getMonth() + 1; // 1..12

          // If customer has recent invoices, find the next unbilled month
          const latestInv = customer.invoices[0];
          if (latestInv) {
            const [yr, mo] = latestInv.month.split('-').map(Number);
            if (mo === 12) {
              nextYear = yr + 1;
              nextMonth = 1;
            } else {
              nextYear = yr;
              nextMonth = mo + 1;
            }
          }
          targetMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
        }

        // Loop until an unbilled / unpaid month is found
        while (targetInvoice && targetInvoice.payments.reduce((s, p) => s + p.amount, 0) >= targetInvoice.total) {
          const [yr, mo] = targetMonth.split('-').map(Number);
          const nextYr = mo === 12 ? yr + 1 : yr;
          const nextMo = mo === 12 ? 1 : mo + 1;
          targetMonth = `${nextYr}-${String(nextMo).padStart(2, '0')}`;
          targetInvoice = await prisma.invoice.findUnique({
            where: { customerId_month: { customerId: id, month: targetMonth } },
            include: { payments: true },
          });
        }

        if (!targetInvoice) {
          const baseAmount = customAmount ? parseFloat(customAmount) : (customer.package?.price || 500) * (parseInt(monthsCount) || 1);
          const [year, monthNum] = targetMonth.split('-').map(Number);
          const dueDate = new Date(year, monthNum - 1, 10);

          targetInvoice = await prisma.invoice.create({
            data: {
              customerId: id,
              month: targetMonth,
              amount: baseAmount,
              discount: 0,
              vat: 0,
              total: baseAmount,
              dueDate,
              status: 'UNPAID',
            },
            include: { payments: true },
          });
        }
      }
    }

    if (!targetInvoice) {
      throw new Error('Unable to create or locate invoice for payment');
    }

    const payResult = await bkashService.createPayment({
      invoiceId: targetInvoice.id,
      customAmount: customAmount || null,
      payerReference: customer.phone || customer.pppoeUsername,
      userId: null,
    });

    return {
      ...payResult,
      invoiceId: targetInvoice.id,
      month: targetInvoice.month,
    };
  }
}

module.exports = new CustomerPortalService();

