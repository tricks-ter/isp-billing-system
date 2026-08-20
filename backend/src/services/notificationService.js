const prisma = require('../config/db');

class NotificationService {
  async createNotification(userId, title, message, type = 'INFO') {
    return await prisma.notification.create({ data: { userId, title, message, type } });
  }

  async getUnreadCount(userId) {
    return await prisma.notification.count({ where: { userId, isRead: false } });
  }

  async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, pagination: { page, limit, total } };
  }

  async markAsRead(id, userId) {
    return await prisma.notification.updateMany({ where: { id: parseInt(id), userId }, data: { isRead: true } });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }
}

module.exports = new NotificationService();