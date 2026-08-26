const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');
const oltService = require('./oltService');
const { v4: uuidv4 } = require('uuid');

class CustomerService {
  async getAllCustomers(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { pppoeUsername: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          package: true,
          router: true,
          olt: { select: { id: true, name: true, brand: true } },
          onu: { select: { id: true, portNumber: true, onuId: true, macAddress: true, serialNumber: true, status: true, rxPower: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerStats() {
    const [total, active, suspended] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'SUSPENDED' } }),
    ]);
    return { total, active, suspended, expired: 0 };
  }

  async getCustomerById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async createCustomer(data, userId) {
    // Check for existing phone number
    const existingPhone = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new Error(`A customer with phone number '${data.phone}' already exists (${existingPhone.name}).`);
    }

    // Generate PPPoE credentials if not provided
    const pppoeUsername = data.pppoeUsername && data.pppoeUsername.trim() !== ''
      ? data.pppoeUsername.trim()
      : `pppoe_${uuidv4().slice(0, 8)}`;
    const pppoePassword = data.pppoePassword && data.pppoePassword.trim() !== ''
      ? data.pppoePassword.trim()
      : uuidv4().slice(0, 12);

    // Check for existing PPPoE username
    const existingPppoe = await prisma.customer.findUnique({
      where: { pppoeUsername },
    });
    if (existingPppoe) {
      throw new Error(`PPPoE username '${pppoeUsername}' is already in use. Please choose another username.`);
    }

    // Handle routerId & oltId: convert empty string to null
    const routerId = data.routerId ? parseInt(data.routerId) : null;
    const oltId = data.oltId ? parseInt(data.oltId) : null;

    // Create customer in database
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        area: data.area,
        pppoeUsername,
        pppoePassword,
        status: 'ACTIVE',
        packageId: parseInt(data.packageId),
        routerId: routerId,
        oltId: oltId,
        fiberSplitter: data.fiberSplitter || null,
        fiberCore: data.fiberCore || null,
        joinDate: new Date(),
      },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
      },
    });

    // If router is assigned, initiate PPPoE secret creation (NON-BLOCKING)
    if (routerId && customer.router) {
      // Fire and forget - don't await
      mikrotikService.addPppoeSecret(
        customer.router,
        pppoeUsername,
        pppoePassword,
        customer.package.name
      ).catch(error => {
        console.error('Failed to create PPPoE secret on router:', error.message);
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CUSTOMER',
        details: JSON.stringify({
          customerId: customer.id,
          name: customer.name,
          routerId: routerId
        }),
      },
    });

    return customer;
  }

  async updateCustomer(id, data, userId) {
    const customerId = parseInt(id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { package: true, router: true, olt: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (data.phone && data.phone !== customer.phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { phone: data.phone },
      });
      if (existingPhone && existingPhone.id !== customerId) {
        throw new Error(`A customer with phone number '${data.phone}' already exists (${existingPhone.name}).`);
      }
    }

    // Handle routerId & oltId: convert empty string to null
    const newRouterId = data.routerId ? parseInt(data.routerId) : (data.routerId === null || data.routerId === '' ? null : customer.routerId);
    const newOltId = data.oltId ? parseInt(data.oltId) : (data.oltId === null || data.oltId === '' ? null : customer.oltId);
    const packageId = data.packageId ? parseInt(data.packageId) : customer.packageId;

    // Update customer in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name !== undefined ? data.name : customer.name,
        phone: data.phone !== undefined ? data.phone : customer.phone,
        address: data.address !== undefined ? data.address : customer.address,
        area: data.area !== undefined ? data.area : customer.area,
        pppoeUsername: data.pppoeUsername ? data.pppoeUsername.trim() : customer.pppoeUsername,
        pppoePassword: data.pppoePassword ? data.pppoePassword.trim() : customer.pppoePassword,
        packageId,
        routerId: newRouterId,
        oltId: newOltId,
        fiberSplitter: data.fiberSplitter !== undefined ? data.fiberSplitter : customer.fiberSplitter,
        fiberCore: data.fiberCore !== undefined ? data.fiberCore : customer.fiberCore,
      },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
      },
    });

    // If router changed or package changed, update PPPoE on router (NON-BLOCKING)
    if (customer.routerId || newRouterId) {
      const oldRouter = customer.router;
      const newRouter = updatedCustomer.router;

      // Remove from old router if it changed
      if (oldRouter && oldRouter.id !== newRouterId) {
        mikrotikService.removePppoeSecret(oldRouter, customer.pppoeUsername)
          .catch(error => console.error('Failed to remove from old router:', error.message));
      }

      // Add to new router
      if (newRouter) {
        mikrotikService.addPppoeSecret(
          newRouter,
          updatedCustomer.pppoeUsername,
          updatedCustomer.pppoePassword,
          updatedCustomer.package.name
        ).catch(error => console.error('Failed to add to new router:', error.message));
      }
    }

    // Log the action safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'UPDATE_CUSTOMER',
          details: JSON.stringify({
            customerId: updatedCustomer.id,
            changes: data,
            routerChanged: customer.routerId !== newRouterId
          }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return updatedCustomer;
  }

  async deleteCustomer(id, userId) {
    const customerId = parseInt(id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { router: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Remove PPPoE secret from router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.removePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to remove PPPoE secret from router:', error.message));
    }

    // Transactionally cascade delete ONUs, payments, invoices and customer
    await prisma.$transaction(async (tx) => {
      await tx.onu.deleteMany({
        where: { customerId },
      });

      await tx.payment.deleteMany({
        where: {
          invoice: {
            customerId,
          },
        },
      });

      await tx.invoice.deleteMany({
        where: { customerId },
      });

      await tx.customer.delete({
        where: { id: customerId },
      });
    });

    // Log the action safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'DELETE_CUSTOMER',
          details: JSON.stringify({ customerId: customer.id, name: customer.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return { success: true };
  }

  async suspendCustomer(id, userId) {
    const customerId = parseInt(id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { router: true, olt: true, onu: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    if (customer.status === 'SUSPENDED') {
      throw new Error('Customer is already suspended');
    }

    // Update status in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { status: 'SUSPENDED' },
    });

    // Disable PPPoE on router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.disablePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to disable PPPoE on router:', error.message));
    }

    // Disable ONU on OLT if assigned (NON-BLOCKING)
    if (customer.oltId && customer.onu) {
      oltService.toggleCustomerOnu(customerId, true)
        .catch(error => console.error('Failed to disable ONU on OLT:', error.message));
    }

    // Log the action safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'SUSPEND_CUSTOMER',
          details: JSON.stringify({ customerId: customer.id, name: customer.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return updatedCustomer;
  }

  async restoreCustomer(id, userId) {
    const customerId = parseInt(id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { router: true, olt: true, onu: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    if (customer.status === 'ACTIVE') {
      throw new Error('Customer is already active');
    }

    // Update status in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { status: 'ACTIVE' },
    });

    // Enable PPPoE on router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.enablePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to enable PPPoE on router:', error.message));
    }

    // Enable ONU on OLT if assigned (NON-BLOCKING)
    if (customer.oltId && customer.onu) {
      oltService.toggleCustomerOnu(customerId, false)
        .catch(error => console.error('Failed to enable ONU on OLT:', error.message));
    }

    // Log the action safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'RESTORE_CUSTOMER',
          details: JSON.stringify({ customerId: customer.id, name: customer.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return updatedCustomer;
  }

  /**
   * Comprehensive Collection & Revenue Intelligence Summary
   */
  async getCollectionSummary() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const customers = await prisma.customer.findMany({
      include: {
        package: true,
        router: true,
        invoices: {
          include: { payments: true },
          orderBy: { month: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalCustomers = customers.length;
    let expectedMonthlyRevenue = 0;
    let actualCollectedRevenue = 0;
    let totalOutstandingDue = 0;

    const paidCustomerList = [];
    const dueCustomerList = [];
    const advancePaidCustomerList = [];

    customers.forEach(cust => {
      const pkgPrice = cust.package ? cust.package.price : 0;
      if (cust.status === 'ACTIVE') {
        expectedMonthlyRevenue += pkgPrice;
      }

      let customerCurrentDue = 0;
      let customerTotalPaidThisMonth = 0;
      let isPaidCurrentMonth = false;
      let hasAdvancePaid = false;

      cust.invoices.forEach(inv => {
        const paidForInv = inv.payments.reduce((s, p) => s + p.amount, 0);
        const invDue = Math.max(0, inv.total - paidForInv);

        inv.payments.forEach(p => {
          const pDate = new Date(p.date || p.createdAt);
          const pMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
          if (pMonth === currentMonth) {
            actualCollectedRevenue += p.amount;
            customerTotalPaidThisMonth += p.amount;
          }
        });

        if (inv.month === currentMonth) {
          if (inv.status === 'PAID' || invDue === 0) {
            isPaidCurrentMonth = true;
          } else {
            customerCurrentDue += invDue;
          }
        } else if (inv.month < currentMonth) {
          if (invDue > 0) {
            customerCurrentDue += invDue;
          }
        } else if (inv.month > currentMonth) {
          if (inv.status === 'PAID' || paidForInv > 0) {
            hasAdvancePaid = true;
          }
        }
      });

      totalOutstandingDue += customerCurrentDue;

      const customerSummary = {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        area: cust.area || 'N/A',
        pppoeUsername: cust.pppoeUsername,
        packageName: cust.package?.name || 'N/A',
        packagePrice: pkgPrice,
        status: cust.status,
        dueAmount: customerCurrentDue,
        paidThisMonth: customerTotalPaidThisMonth,
        collectionNote: cust.collectionNote,
        promisedPayDate: cust.promisedPayDate,
        notesUpdatedAt: cust.notesUpdatedAt,
      };

      if (customerCurrentDue > 0) {
        dueCustomerList.push(customerSummary);
      } else {
        paidCustomerList.push(customerSummary);
      }

      if (hasAdvancePaid) {
        advancePaidCustomerList.push(customerSummary);
      }
    });

    const collectionEfficiency = expectedMonthlyRevenue > 0
      ? Math.min(100, Math.round((actualCollectedRevenue / expectedMonthlyRevenue) * 100))
      : 100;

    return {
      currentMonth,
      totalCustomers,
      paidCount: paidCustomerList.length,
      dueCount: dueCustomerList.length,
      advanceCount: advancePaidCustomerList.length,
      expectedMonthlyRevenue,
      actualCollectedRevenue,
      totalOutstandingDue,
      collectionEfficiency,
      lists: {
        all: customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          pppoeUsername: c.pppoeUsername,
          packageName: c.package?.name || 'N/A',
          packagePrice: c.package?.price || 0,
          status: c.status,
          collectionNote: c.collectionNote,
          promisedPayDate: c.promisedPayDate,
        })),
        paid: paidCustomerList,
        due: dueCustomerList,
        advance: advancePaidCustomerList,
      },
    };
  }

  /**
   * Update Payment Collection Note & Promised Pay Date
   */
  async updateCollectionNote(customerId, { collectionNote, promisedPayDate }, actingUserId = 1) {
    const id = parseInt(customerId);
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        collectionNote: collectionNote !== undefined ? collectionNote : undefined,
        promisedPayDate: promisedPayDate ? new Date(promisedPayDate) : null,
        notesUpdatedAt: new Date(),
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: actingUserId,
          action: 'UPDATE_COLLECTION_NOTE',
          details: JSON.stringify({
            customerId: id,
            customerName: updated.name,
            note: collectionNote,
            promisedPayDate,
          }),
        },
      });
    } catch (_) {}

    return updated;
  }
}

module.exports = new CustomerService();