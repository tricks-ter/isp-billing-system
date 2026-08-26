// backend/src/controllers/oltController.js
const oltService = require('../services/oltService');

class OltController {
  async getAllOlts(req, res) {
    try {
      const olts = await oltService.getAllOlts();
      res.json({ success: true, data: olts });
    } catch (error) {
      console.error('getAllOlts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOltById(req, res) {
    try {
      const olt = await oltService.getOltById(req.params.id);
      res.json({ success: true, data: olt });
    } catch (error) {
      console.error('getOltById error:', error);
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async createOlt(req, res) {
    try {
      const olt = await oltService.createOlt(req.body, req.user?.id || 1);
      res.status(201).json({ success: true, data: olt, message: 'OLT created successfully' });
    } catch (error) {
      console.error('createOlt error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateOlt(req, res) {
    try {
      const olt = await oltService.updateOlt(req.params.id, req.body, req.user?.id || 1);
      res.json({ success: true, data: olt, message: 'OLT updated successfully' });
    } catch (error) {
      console.error('updateOlt error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteOlt(req, res) {
    try {
      const result = await oltService.deleteOlt(req.params.id, req.user?.id || 1);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('deleteOlt error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async testConnection(req, res) {
    try {
      const result = await oltService.testConnection(req.params.id);
      res.json({ success: result.success !== false, data: result });
    } catch (error) {
      console.error('testConnection error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async syncOlt(req, res) {
    try {
      const result = await oltService.syncOlt(req.params.id, req.user?.id || 1);
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      console.error('syncOlt error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPonPorts(req, res) {
    try {
      const ports = await oltService.getPonPorts(req.params.id);
      res.json({ success: true, data: ports });
    } catch (error) {
      console.error('getPonPorts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRegisteredOnus(req, res) {
    try {
      const { page, limit, portNumber, search, status, signalQuality } = req.query;
      const data = await oltService.getRegisteredOnus(req.params.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        portNumber,
        search,
        status,
        signalQuality,
      });
      res.json({ success: true, data });
    } catch (error) {
      console.error('getRegisteredOnus error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUnregisteredOnus(req, res) {
    try {
      const data = await oltService.getUnregisteredOnus(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      console.error('getUnregisteredOnus error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOpticalDiagnostics(req, res) {
    try {
      const { id, onuId } = req.params;
      const data = await oltService.getOpticalDiagnostics(id, onuId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('getOpticalDiagnostics error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async authorizeOnu(req, res) {
    try {
      const result = await oltService.authorizeOnu(req.params.id, req.body, req.user?.id || 1);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('authorizeOnu error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async unauthorizeOnu(req, res) {
    try {
      const { id, onuId } = req.params;
      const result = await oltService.unauthorizeOnu(id, onuId, req.user?.id || 1);
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      console.error('unauthorizeOnu error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async rebootOnu(req, res) {
    try {
      const { id, onuId } = req.params;
      const result = await oltService.rebootOnu(id, onuId, req.user?.id || 1);
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      console.error('rebootOnu error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async toggleOnuPort(req, res) {
    try {
      const { id, onuId } = req.params;
      const { disable } = req.body;
      const result = await oltService.toggleOnuPort(id, onuId, disable, req.user?.id || 1);
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      console.error('toggleOnuPort error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async executeRawCli(req, res) {
    try {
      const { id } = req.params;
      const { command } = req.body;
      if (!command) throw new Error('Command is required');
      const result = await oltService.executeRawCli(id, command, req.user?.id || 1);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('executeRawCli error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOpticalSummary(req, res) {
    try {
      const summary = await oltService.getOpticalSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('getOpticalSummary error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OltController();
