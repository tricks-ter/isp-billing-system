// FILE: ./backend/src/services/mikrotikService.js
const RouterOSAPI = require('routeros-api');
const fs = require('fs').promises;
const path = require('path');
const settingsService = require('./settingsService');

class MikroTikService {
  constructor() {
    this.mockMode = process.env.MIKROTIK_MOCK_MODE === 'true';
    this.logFile = path.join(__dirname, '../../logs/mikrotik-operations.log');
    fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(() => {});
  }

  async initializeMockMode() {
    try {
      const dbMockMode = await settingsService.getMikrotikMockMode();
      this.mockMode = dbMockMode;
      console.log(`[MikroTik Service] Mock Mode initialized from DB: ${this.mockMode}`);
    } catch (error) {
      console.log('[MikroTik Service] Using env variable for Mock Mode:', this.mockMode);
    }
  }

  setMockMode(isMock) {
    this.mockMode = isMock;
    console.log(`[MikroTik Service] Mock Mode set to: ${this.mockMode}`);
    return this.mockMode;
  }

  getMockMode() {
    return this.mockMode;
  }

  async log(operation, params, result) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${operation} | Params: ${JSON.stringify(params)} | Result: ${JSON.stringify(result)}\n`;
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write MikroTik log:', error);
    }
  }

  async connectToRouter(router) {
    if (this.mockMode) return { mock: true, router };
    try {
      const api = new RouterOSAPI({
        host: router.ipAddress,
        user: router.username,
        password: router.password,
        port: router.apiPort || 8728,
        timeout: 5000,
      });
      await api.connect();
      return api;
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async disconnect(api) {
    if (!this.mockMode && api && api.close) {
      try { api.close(); } catch (e) { /* ignore close errors */ }
    }
  }

  async addPppoeSecret(router, username, password, profile) {
    const params = { username, password, profile, router: router.name };
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret created' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Added PPPoE: ${username}`);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
      await api.write('/ppp/secret/add', [
        `=name=${username}`,
        `=password=${password}`,
        '=service=pppoe',
        `=profile=${profile}`,
      ]);
      await this.disconnect(api);
      const result = { success: true };
      await this.log('ADD_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('ADD_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to add PPPoE secret: ${error.message}`);
    }
  }

  async disablePppoeSecret(router, username) {
    const params = { username, router: router.name };
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE disabled' };
      await this.log('DISABLE_PPPOE_SECRET', params, result);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) throw new Error(`PPPoE secret not found: ${username}`);
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=yes']);
      await this.disconnect(api);
      const result = { success: true };
      await this.log('DISABLE_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('DISABLE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to disable PPPoE: ${error.message}`);
    }
  }

  async enablePppoeSecret(router, username) {
    const params = { username, router: router.name };
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE enabled' };
      await this.log('ENABLE_PPPOE_SECRET', params, result);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) throw new Error(`PPPoE secret not found: ${username}`);
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=no']);
      await this.disconnect(api);
      const result = { success: true };
      await this.log('ENABLE_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('ENABLE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to enable PPPoE: ${error.message}`);
    }
  }

  async removePppoeSecret(router, username) {
    const params = { username, router: router.name };
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE removed' };
      await this.log('REMOVE_PPPOE_SECRET', params, result);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) throw new Error(`PPPoE secret not found: ${username}`);
      await api.write('/ppp/secret/remove', [`.id=${secrets[0]['.id']}`]);
      await this.disconnect(api);
      const result = { success: true };
      await this.log('REMOVE_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('REMOVE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to remove PPPoE: ${error.message}`);
    }
  }

  async testConnection(router) {
    if (this.mockMode) {
      return {
        success: true,
        mock: true,
        message: 'Mock Mode Active',
        data: { identity: `${router.name} (Mock)`, version: '7.15 (Mock)', uptime: 'N/A' }
      };
    }
    try {
      const api = await this.connectToRouter(router);
      const identity = await api.write('/system/identity/print');
      const resource = await api.write('/system/resource/print');
      await this.disconnect(api);
      return {
        success: true,
        mock: false,
        message: 'Connection successful',
        data: {
          identity: identity[0]?.name || 'Unknown',
          version: resource[0]?.version || 'Unknown',
          uptime: resource[0]?.uptime || 'Unknown',
          freeMemory: resource[0]?.['free-memory'] || 'Unknown',
        }
      };
    } catch (error) {
      return {
        success: false,
        mock: false,
        message: `Connection failed: ${error.message}`,
        data: null
      };
    }
  }

  async getRouterActiveSessions(router) {
    if (this.mockMode) return [];
    try {
      const api = await this.connectToRouter(router);
      const sessions = await api.write('/ppp/active/print');
      await this.disconnect(api);
      return sessions.map(s => ({
        id: s['.id'],
        username: s.name,
        address: s.address,
        uptime: s.uptime,
        routerName: router.name,
        routerId: router.id
      }));
    } catch (error) {
      console.error(`Failed to get sessions from ${router.name}:`, error.message);
      return [];
    }
  }
}

const mikrotikService = new MikroTikService();
mikrotikService.initializeMockMode();

module.exports = mikrotikService;