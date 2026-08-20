const financeService = require('../services/financeService');

class FinanceController {
  async addIncome(req, res) {
    try {
      const income = await financeService.addIncome(req.body, req.user.id);
      return res.status(201).json({ success: true, data: income });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async addExpense(req, res) {
    try {
      const expense = await financeService.addExpense(req.body, req.user.id);
      return res.status(201).json({ success: true, data: expense });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async getTransactions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = { fromDate: req.query.fromDate, toDate: req.query.toDate, category: req.query.category };
      const result = await financeService.getTransactions(page, limit, filters);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
  async getMonthlySummary(req, res) {
    try {
      const { month } = req.query;
      if (!month) return res.status(400).json({ success: false, message: 'Month required' });
      const summary = await financeService.getMonthlySummary(month);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new FinanceController();