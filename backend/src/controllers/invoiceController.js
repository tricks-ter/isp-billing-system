const invoiceService = require('../services/invoiceService');

class InvoiceController {
  async generate(req, res) {
    try {
      const { month, routerId } = req.body;
      if (!month) {
        return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });
      }

      const results = await invoiceService.generateMonthlyInvoices(month, req.user?.id || 1, routerId);
      return res.status(201).json({
        success: true,
        data: results,
        message: `Generated ${results.created} invoices, skipped ${results.skipped} existing.`
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        status: req.query.status,
        customerId: req.query.customerId,
        month: req.query.month,
      };

      const result = await invoiceService.getAllInvoices(page, limit, filters);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async getMonthlySummary(req, res) {
    try {
      const { month } = req.query;
      if (!month) {
        return res.status(400).json({ success: false, message: 'Month is required' });
      }
      const summary = await invoiceService.getMonthlySummary(month);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new InvoiceController();