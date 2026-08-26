const customerService = require('../services/customerService');

class CustomerController {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';

      const result = await customerService.getAllCustomers(page, limit, search);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await customerService.getCustomerStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return res.status(200).json({ success: true, data: customer });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const customer = await customerService.createCustomer(req.body, req.user?.id || 1);
      return res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body, req.user?.id || 1);
      return res.status(200).json({ success: true, data: customer, message: 'Customer updated successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await customerService.deleteCustomer(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, message: result.message || 'Customer deleted successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async suspend(req, res) {
    try {
      const customer = await customerService.suspendCustomer(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, data: customer, message: 'Customer suspended successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async restore(req, res) {
    try {
      const customer = await customerService.restoreCustomer(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, data: customer, message: 'Customer restored successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCollectionSummary(req, res) {
    try {
      const summary = await customerService.getCollectionSummary();
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateCollectionNote(req, res) {
    try {
      const updated = await customerService.updateCollectionNote(
        req.params.id,
        req.body,
        req.user?.id || 1
      );
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Payment collection note saved successfully',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CustomerController();