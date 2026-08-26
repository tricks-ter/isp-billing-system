const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');

class NotificationController {
  async getUnreadCount(req, res) {
    try {
      const count = await notificationService.getUnreadCount(req.user?.id || 1);
      return res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNotifications(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await notificationService.getNotifications(req.user?.id || 1, page, limit);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      await notificationService.markAsRead(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.user?.id || 1);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendDueReminders(req, res) {
    try {
      const result = await smsService.sendDueReminders();
      return res.status(200).json({
        success: true,
        data: result,
        message: `Sent ${result.sent} reminders, ${result.failed} failed.`
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new NotificationController();