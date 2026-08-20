const auditService = require('../services/auditService');

class AuditController {
  async getLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const filters = { userId: req.query.userId, action: req.query.action, fromDate: req.query.fromDate, toDate: req.query.toDate };
      const result = await auditService.getLogs(page, limit, filters);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
  async getStats(req, res) {
    try {
      const stats = await auditService.getStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuditController();