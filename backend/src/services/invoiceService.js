const prisma = require('../config/db');

class InvoiceService {
  async generateMonthlyInvoices(month, userId, routerId = null) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Use YYYY-MM (e.g. 2026-08)');
    }

    const [year, monthNum] = month.split('-').map(Number);
    const dueDate = new Date(year, monthNum - 1, 10); // Due on 10th of the month

    // Find all ACTIVE customers
    const where = { status: 'ACTIVE' };
    if (routerId) where.routerId = parseInt(routerId);

    const customers = await prisma.customer.findMany({
      where,
      include: { package: true },
    });

    if (customers.length === 0) {
      throw new Error('No active customers found to generate invoices for.');
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const customer of customers) {
      try {
        const existing = await prisma.invoice.findUnique({
          where: {
            customerId_month: {
              customerId: customer.id,
              month,
            },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        const baseAmount = customer.package?.price || 0;
        const discount = 0;
        const vat = 0;
        const total = baseAmount - discount + vat;

        await prisma.invoice.create({
          data: {
            customerId: customer.id,
            month,
            amount: baseAmount,
            discount,
            vat,
            total,
            dueDate,
            status: 'UNPAID',
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          customerId: customer.id,
          name: customer.name,
          error: error.message,
        });
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'GENERATE_INVOICES',
          details: JSON.stringify({ month, results }),
        },
      });
    } catch (e) {}

    return results;
  }

  async getAllInvoices(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = parseInt(filters.customerId);
    if (filters.month) where.month = filters.month;

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              pppoeUsername: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const invoicesWithPaid = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...inv,
        paidAmount,
        dueAmount: Math.max(0, inv.total - paidAmount),
      };
    });

    return {
      invoices: invoicesWithPaid,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: {
          include: { package: true },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...invoice,
      paidAmount,
      dueAmount: Math.max(0, invoice.total - paidAmount),
    };
  }

  async getMonthlySummary(month) {
    const invoices = await prisma.invoice.findMany({
      where: { month },
      include: { payments: true },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => {
      return sum + inv.payments.reduce((s, p) => s + p.amount, 0);
    }, 0);
    const totalDue = Math.max(0, totalAmount - totalPaid);
    const paidInvoices = invoices.filter((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return paid >= inv.total;
    }).length;

    return {
      month,
      totalInvoices,
      totalAmount,
      totalPaid,
      totalDue,
      paidInvoices,
      unpaidInvoices: totalInvoices - paidInvoices,
    };
  }
}

module.exports = new InvoiceService();