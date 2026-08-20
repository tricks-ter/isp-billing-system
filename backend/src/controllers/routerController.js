const routerService = require('../services/routerService');

class RouterController {
  async getAll(req, res) {
    try {
      const routers = await routerService.getAllRouters();
      return res.status(200).json({ success: true, data: routers });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const router = await routerService.getRouterById(req.params.id);
      return res.status(200).json({ success: true, data: router });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const router = await routerService.createRouter(req.body, req.user.id);
      return res.status(201).json({ success: true, data: router });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const router = await routerService.updateRouter(req.params.id, req.body, req.user.id);
      return res.status(200).json({ success: true, data: router });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      await routerService.deleteRouter(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Router deleted' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async testConnection(req, res) {
    try {
      const result = await routerService.testConnection(req.params.id);
      return res.status(200).json({ success: result.success, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLiveStatus(req, res) {
    try {
      const status = await routerService.getLiveStatus();
      return res.status(200).json({ success: true, data: status });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async bulkSuspend(req, res) {
    try {
      const { customerIds } = req.body;
      if (!customerIds || !Array.isArray(customerIds)) {
        return res.status(400).json({ success: false, message: 'customerIds array is required' });
      }
      const results = await routerService.bulkSuspend(customerIds, req.user.id);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async bulkRestore(req, res) {
    try {
      const { customerIds } = req.body;
      if (!customerIds || !Array.isArray(customerIds)) {
        return res.status(400).json({ success: false, message: 'customerIds array is required' });
      }
      const results = await routerService.bulkRestore(customerIds, req.user.id);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new RouterController();