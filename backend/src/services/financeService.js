const prisma = require('../config/db');

class FinanceService {
  async addIncome(data, userId) {
    if (!data.category || data.category.trim() === '') {
      throw new Error('Income category is required');
    }
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Income amount must be greater than 0');
    }

    const income = await prisma.income.create({
      data: {
        category: data.category.trim(),
        amount,
        description: data.description ? data.description.trim() : null,
        date: data.date ? new Date(data.date) : new Date(),
        recordedBy: userId || 1,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'ADD_INCOME',
          details: JSON.stringify({ incomeId: income.id, amount: income.amount, category: income.category }),
        },
      });
    } catch (e) {}

    return income;
  }

  async addExpense(data, userId) {
    if (!data.category || data.category.trim() === '') {
      throw new Error('Expense category is required');
    }
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Expense amount must be greater than 0');
    }

    const expense = await prisma.expense.create({
      data: {
        category: data.category.trim(),
        amount,
        description: data.description ? data.description.trim() : null,
        date: data.date ? new Date(data.date) : new Date(),
        recordedBy: userId || 1,
        billUrl: data.billUrl || null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'ADD_EXPENSE',
          details: JSON.stringify({ expenseId: expense.id, amount: expense.amount, category: expense.category }),
        },
      });
    } catch (e) {}

    return expense;
  }

  async getTransactions(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.fromDate || filters.toDate) {
      where.date = {};
      if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.date.lte = new Date(filters.toDate);
    }
    if (filters.category) where.category = filters.category;

    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where,
        skip,
        take: limit,
        include: { recorder: { select: { fullName: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: { recorder: { select: { fullName: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);

    const allTransactions = [
      ...incomes.map(i => ({ ...i, type: 'INCOME' })),
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      transactions: allTransactions.slice(0, limit),
      summary: { totalIncome, totalExpense, net: totalIncome - totalExpense },
      pagination: { page, limit },
    };
  }

  async getMonthlySummary(month) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const [incomes, expenses, payments] = await Promise.all([
      prisma.income.aggregate({ where: { date: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.expense.aggregate({ where: { date: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.payment.aggregate({ where: { date: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: { _all: true } }),
    ]);

    const customerPayments = payments._sum.amount || 0;
    const otherIncome = incomes._sum.amount || 0;
    const totalExpense = expenses._sum.amount || 0;
    const totalIncome = customerPayments + otherIncome;

    return {
      month,
      customerPayments,
      otherIncome,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      paymentCount: payments._count._all,
      incomeCount: incomes._count._all,
      expenseCount: expenses._count._all,
    };
  }
}

module.exports = new FinanceService();