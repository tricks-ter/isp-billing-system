const prisma = require('../config/db');

class InvoiceService {
  async generateMonthlyInvoices(month, userId, routerId = null) {
    // month format: "2026-08"
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Use YYYY-MM');
    }

    const [year, monthNum] = month.split('-').map(Number);
    const dueDate = new Date(year, monthNum - 1, 10); // Due on 10th of the month
    const periodStart = new Date(year, monthNum - 1, 1);
    const periodEnd = new Date(year, monthNum, 0); // Last day of month

    // Find all ACTIVE customers (optionally filtered by router)
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

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      for (const customer of customers) {
        try {
          // Check if invoice already exists for this customer/month
          const existing = await tx.invoice.findUnique({
            where: {
              customerId_month: {
                customerId: customer.id,
                month: month,
              },
            },
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          // Calculate invoice amount
          const baseAmount = customer.package.price;
          const discount = 0; // Can be extended later
          const vat = 0; // Can be extended later
          const total = baseAmount - discount + vat;

          // Create invoice
          await tx.invoice.create({
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
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'GENERATE_INVOICES',
        details: JSON.stringify({ month, results }),
      },
    });

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

    // Calculate paid amount for each invoice
    const invoicesWithPaid = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...inv,
        paidAmount,
        dueAmount: inv.total - paidAmount,
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
      dueAmount: invoice.total - paidAmount,
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
    const totalDue = totalAmount - totalPaid;
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