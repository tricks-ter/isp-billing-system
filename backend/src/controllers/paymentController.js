const paymentService = require('../services/paymentService');

class PaymentController {
  async record(req, res) {
    try {
      const payment = await paymentService.recordPayment(req.body, req.user?.id || 1);
      return res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        method: req.query.method,
        receivedBy: req.query.receivedBy,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };

      const result = await paymentService.getAllPayments(page, limit, filters);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDailyCollection(req, res) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
      }
      const result = await paymentService.getDailyCollection(date);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();