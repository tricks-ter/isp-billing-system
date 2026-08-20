// FILE: ./backend/src/controllers/routerController.js
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
      return res.status(200).json(result);
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

  // NEW CONTROLLER METHODS
  async getRouterInfo(req, res) {
    try {
      const info = await routerService.getRouterInfo(req.params.id);
      return res.status(200).json({ success: true, data: info });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPppoeSecrets(req, res) {
    try {
      const secrets = await routerService.getPppoeSecrets(req.params.id);
      return res.status(200).json({ success: true, data: secrets });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async createPppoeSecret(req, res) {
    try {
      const { username, password, profile, comment } = req.body;
      if (!username || !password || !profile) {
        return res.status(400).json({ success: false, message: 'username, password, and profile are required' });
      }
      const result = await routerService.createPppoeSecret(req.params.id, username, password, profile, comment || '');
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updatePppoeSecret(req, res) {
    try {
      const { newPassword, newProfile } = req.body;
      const result = await routerService.updatePppoeSecret(req.params.id, req.params.username, newPassword, newProfile);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async deletePppoeSecret(req, res) {
    try {
      const result = await routerService.deletePppoeSecret(req.params.id, req.params.username);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getActiveSessions(req, res) {
    try {
      const sessions = await routerService.getActiveSessions(req.params.id);
      return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getProfiles(req, res) {
    try {
      const profiles = await routerService.getProfiles(req.params.id);
      return res.status(200).json({ success: true, data: profiles });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSimpleQueues(req, res) {
    try {
      const queues = await routerService.getSimpleQueues(req.params.id);
      return res.status(200).json({ success: true, data: queues });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new RouterController();