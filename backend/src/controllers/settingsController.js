// FILE: ./backend/src/controllers/settingsController.js
const settingsService = require('../services/settingsService');
const mikrotikService = require('../services/mikrotikService');

class SettingsController {
  async getMikrotikMockMode(req, res) {
    try {
      const mockMode = await settingsService.getMikrotikMockMode();
      mikrotikService.setMockMode(mockMode);
      return res.status(200).json({ success: true, data: { mockMode } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async setMikrotikMockMode(req, res) {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ success: false, message: 'enabled must be a boolean' });
      }
      const result = await settingsService.setMikrotikMockMode(enabled, req.user.id);
      mikrotikService.setMockMode(enabled);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSmsMockMode(req, res) {
    try {
      const mockMode = await settingsService.getSmsMockMode();
      return res.status(200).json({ success: true, data: { mockMode } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async setSmsMockMode(req, res) {
    try {
      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ success: false, message: 'enabled must be a boolean' });
      }
      const result = await settingsService.setSmsMockMode(enabled, req.user.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllSettings(req, res) {
    try {
      const settings = await settingsService.getAllSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SettingsController();