// backend/src/controllers/customerPortalController.js
const customerPortalService = require('../services/customerPortalService');
const bkashService = require('../services/bkashService');

class CustomerPortalController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await customerPortalService.login(username, password);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Logged into customer self-care portal successfully',
      });
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  async getDashboard(req, res) {
    try {
      const data = await customerPortalService.getDashboard(req.customer.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getInvoices(req, res) {
    try {
      const invoices = await customerPortalService.getInvoices(req.customer.id);
      return res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPayments(req, res) {
    try {
      const payments = await customerPortalService.getPayments(req.customer.id);
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTickets(req, res) {
    try {
      const tickets = await customerPortalService.getSupportTickets(req.customer.id);
      return res.status(200).json({ success: true, data: tickets });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createTicket(req, res) {
    try {
      const ticket = await customerPortalService.createSupportTicket(req.customer.id, req.body);
      return res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket submitted successfully',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPackages(req, res) {
    try {
      const packages = await customerPortalService.getAvailablePackages();
      return res.status(200).json({ success: true, data: packages });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const profile = await customerPortalService.updateProfile(req.customer.id, req.body);
      return res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile contact updated successfully',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async initiateBkashPayment(req, res) {
    try {
      const result = await customerPortalService.initiatePayment(req.customer.id, req.body);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'bKash payment initiated successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to initiate bKash payment',
      });
    }
  }
}

module.exports = new CustomerPortalController();

