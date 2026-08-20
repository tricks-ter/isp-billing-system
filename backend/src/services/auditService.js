const prisma = require('../config/db');

class AuditService {
  async getLogs(page = 1, limit = 50, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.userId) where.userId = parseInt(filters.userId);
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getStats() {
    const total = await prisma.auditLog.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.auditLog.count({ where: { createdAt: { gte: today } } });

    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: 10,
    });

    return { total, todayCount, topActions: actionCounts };
  }
}

module.exports = new AuditService();