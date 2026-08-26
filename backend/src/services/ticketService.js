// backend/src/services/ticketService.js
const prisma = require('../config/db');

class TicketService {
  /**
   * Get all support tickets with filtering, searching, and pagination
   */
  async getAllTickets(query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = (query.search || '').trim();
    const status = query.status || 'ALL';
    const category = query.category || 'ALL';
    const priority = query.priority || 'ALL';

    const where = {};

    if (status !== 'ALL') {
      where.status = status;
    }
    if (category !== 'ALL') {
      where.category = category;
    }
    if (priority !== 'ALL') {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { ticketNo: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { pppoeUsername: { contains: search, mode: 'insensitive' } },
              { area: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          customer: {
            include: {
              package: true,
              router: true,
              olt: true,
              onu: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // OPEN first
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ticket stats summary (total, open, in progress, resolved)
   */
  async getTicketStats() {
    const [total, open, inProgress, resolved, urgent] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { priority: 'URGENT', status: { not: 'RESOLVED' } } }),
    ]);

    return { total, open, inProgress, resolved, urgent };
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: {
          include: {
            package: true,
            router: true,
            olt: true,
            onu: true,
          },
        },
      },
    });

    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  /**
   * Admin reply and status update
   */
  async updateTicket(id, data, actingUserId = 1) {
    const ticketId = parseInt(id);
    const { status, adminReply, priority } = data;

    const existing = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });

    if (!existing) throw new Error('Support ticket not found');

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status || existing.status,
        adminReply: adminReply !== undefined ? adminReply : existing.adminReply,
        priority: priority || existing.priority,
      },
      include: {
        customer: {
          include: { package: true },
        },
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: actingUserId,
          action: 'UPDATE_SUPPORT_TICKET',
          details: JSON.stringify({
            ticketNo: existing.ticketNo,
            customerName: existing.customer.name,
            newStatus: updated.status,
            reply: adminReply ? 'Reply provided' : 'Status changed',
          }),
        },
      });
    } catch (_) {}

    return updated;
  }

  /**
   * Delete ticket
   */
  async deleteTicket(id, actingUserId = 1) {
    const ticketId = parseInt(id);
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');

    await prisma.supportTicket.delete({ where: { id: ticketId } });

    try {
      await prisma.auditLog.create({
        data: {
          userId: actingUserId,
          action: 'DELETE_SUPPORT_TICKET',
          details: JSON.stringify({ ticketNo: ticket.ticketNo }),
        },
      });
    } catch (_) {}

    return { message: 'Ticket deleted successfully' };
  }
}

module.exports = new TicketService();
