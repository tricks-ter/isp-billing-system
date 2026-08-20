const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService'); // <-- ADDED: Required for auto-restore

class PaymentService {
  async recordPayment(data, userId) {
    const { invoiceId, amount, method, notes } = data;

    // Validate invoice exists (Include router details for auto-restore)
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { 
        payments: true, 
        customer: { include: { router: true } } // <-- ADDED: Need router details
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Calculate current paid amount
    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDue = invoice.total - currentPaid;

    if (amount > remainingDue) {
      throw new Error(`Payment amount (${amount}) exceeds due amount (${remainingDue})`);
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Record payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: parseInt(invoiceId),
          amount: parseFloat(amount),
          method,
          receivedBy: userId,
          notes: notes || null,
        },
      });

      // Update invoice status
      const newPaidAmount = currentPaid + parseFloat(amount);
      let newStatus = 'PARTIAL';
      if (newPaidAmount >= invoice.total) {
        newStatus = 'PAID';
      }

      await tx.invoice.update({
        where: { id: parseInt(invoiceId) },
        data: { status: newStatus },
      });

      // FIX #4: If fully paid and customer was suspended, restore them AND enable MikroTik
      if (newStatus === 'PAID' && invoice.customer.status === 'SUSPENDED') {
        await tx.customer.update({
          where: { id: invoice.customer.id },
          data: { status: 'ACTIVE' },
        });

        // Call MikroTik to enable PPPoE
        if (invoice.customer.routerId && invoice.customer.router) {
          try {
            await mikrotikService.enablePppoeSecret(
              invoice.customer.router,
              invoice.customer.pppoeUsername
            );
          } catch (error) {
            console.error('Failed to enable PPPoE on auto-restore:', error);
            // We don't throw here to avoid rolling back the successful payment
          }
        }
      }

      return payment;
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RECORD_PAYMENT',
        details: JSON.stringify({
          paymentId: result.id,
          invoiceId,
          amount,
          method,
          customerId: invoice.customer.id,
        }),
      },
    });

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
          invoice: {
            include: {
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
          receiver: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDailyCollection(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        invoice: {
          include: {
            customer: { select: { name: true, phone: true } },
          },
        },
        receiver: { select: { fullName: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {});

    return {
      date,
      totalAmount,
      totalPayments: payments.length,
      byMethod,
      payments,
    };
  }
}

module.exports = new PaymentService();