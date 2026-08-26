const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');
const oltService = require('./oltService');

class PaymentService {
  async recordPayment(data, userId) {
    const { invoiceId, amount, method, notes } = data;
    if (!invoiceId) throw new Error('Invoice ID is required');

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // 1. Fetch invoice and customer details BEFORE transaction
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: {
        payments: true,
        customer: { include: { router: true, olt: true, onu: true } },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDue = invoice.total - currentPaid;

    if (paymentAmount > remainingDue) {
      throw new Error(`Payment amount (৳${paymentAmount}) exceeds due amount (৳${remainingDue})`);
    }

    let customerRestored = false;

    // 2. DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: parseInt(invoiceId),
          amount: paymentAmount,
          method: method || 'CASH',
          receivedBy: userId || null,
          notes: notes || null,
        },
      });

      const newPaidAmount = currentPaid + paymentAmount;
      let newStatus = 'PARTIAL';
      if (newPaidAmount >= invoice.total) {
        newStatus = 'PAID';
      }

      await tx.invoice.update({
        where: { id: parseInt(invoiceId) },
        data: { status: newStatus },
      });

      if (newStatus === 'PAID' && invoice.customer.status === 'SUSPENDED') {
        await tx.customer.update({
          where: { id: invoice.customer.id },
          data: { status: 'ACTIVE' },
        });
        customerRestored = true;
      }

      return payment;
    });

    // 3. EXTERNAL HARDWARE RESTORE HOOKS (Non-blocking)
    if (customerRestored) {
      // Restore MikroTik PPPoE
      if (invoice.customer.routerId && invoice.customer.router) {
        mikrotikService.enablePppoeSecret(
          invoice.customer.router,
          invoice.customer.pppoeUsername
        ).catch(error => console.error('Failed to enable PPPoE on auto-restore:', error.message));
      }

      // Restore BDCOM OLT ONU Port
      if (invoice.customer.oltId) {
        oltService.toggleCustomerOnu(invoice.customer.id, false)
          .catch(error => console.error('Failed to enable BDCOM OLT ONU on auto-restore:', error.message));
      }
    }

    // 4. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'RECORD_PAYMENT',
          details: JSON.stringify({
            paymentId: result.id,
            invoiceId,
            amount: paymentAmount,
            method: method || 'CASH',
            customerId: invoice.customer.id,
          }),
        },
      });
    } catch (e) {}

    return result;
  }

  async getAllPayments(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};
    if (filters.method) where.method = filters.method;
    if (filters.receivedBy) where.receivedBy = parseInt(filters.receivedBy);
    if (filters.fromDate || filters.toDate) {
      where.date = {};
      if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.date.lte = new Date(filters.toDate);
    }

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: { include: { customer: { select: { id: true, name: true, phone: true } } } },
          receiver: { select: { id: true, fullName: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDailyCollection(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: {
        invoice: { include: { customer: { select: { name: true, phone: true } } } },
        receiver: { select: { fullName: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {});

    return { date, totalAmount, totalPayments: payments.length, byMethod, payments };
  }
}

module.exports = new PaymentService();