// FILE: ./backend/src/services/mikrotikService.js
const { RouterOSAPI } = require('routeros-api');
const fs = require('fs').promises;
const path = require('path');

class MikroTikService {
  constructor() {
    this.mockMode = process.env.MIKROTIK_MOCK_MODE === 'true';
    this.logFile = path.join(__dirname, '../../logs/mikrotik-operations.log');
    fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(() => {});
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
        timeout: 10000,
      });
      
      await api.connect();
      return api;
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async disconnect(api) {
    if (!this.mockMode && api && api.close) {
      try { 
        api.close(); 
      } catch (e) { 
        console.error('Disconnect error:', e);
      }
    }
  }

  // --- PPPoE Secret Management ---
  async addPppoeSecret(router, username, password, profile, comment = '') {
    const params = { username, password, profile, router: router.name, comment };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret created' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Added PPPoE: ${username}`);
      return result;
    }

    try {
      const api = await this.connectToRouter(router);
      
      // Check if user already exists
      const existing = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (existing.length > 0) {
        await this.disconnect(api);
        throw new Error(`PPPoE secret ${username} already exists`);
      }
      
      await api.write('/ppp/secret/add', [
        `=name=${username}`,
        `=password=${password}`,
        '=service=pppoe',
        `=profile=${profile}`,
        comment ? `=comment=${comment}` : '',
        '=disabled=no',
      ]);
      
      await this.disconnect(api);
      
      const result = { success: true, message: 'PPPoE secret created successfully' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('ADD_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to add PPPoE secret: ${error.message}`);
    }
  }

  async updatePppoeSecret(router, username, newPassword, newProfile) {
    const params = { username, newPassword, newProfile, router: router.name };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret updated' };
      await this.log('UPDATE_PPPOE_SECRET', params, result);
      return result;
    }

    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      
      if (secrets.length === 0) {
        await this.disconnect(api);
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      
      const id = secrets[0]['.id'];
      const commands = [`.id=${id}`];
      
      if (newPassword) commands.push(`=password=${newPassword}`);
      if (newProfile) commands.push(`=profile=${newProfile}`);
      
      await api.write('/ppp/secret/set', commands);
      await this.disconnect(api);
      
      const result = { success: true, message: 'PPPoE secret updated successfully' };
      await this.log('UPDATE_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('UPDATE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to update PPPoE secret: ${error.message}`);
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
      
      if (secrets.length === 0) {
        await this.disconnect(api);
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=yes']);
      await this.disconnect(api);
      
      const result = { success: true, message: 'PPPoE secret disabled successfully' };
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
      
      if (secrets.length === 0) {
        await this.disconnect(api);
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=no']);
      await this.disconnect(api);
      
      const result = { success: true, message: 'PPPoE secret enabled successfully' };
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
      
      if (secrets.length === 0) {
        await this.disconnect(api);
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      
      await api.write('/ppp/secret/remove', [`.id=${secrets[0]['.id']}`]);
      await this.disconnect(api);
      
      const result = { success: true, message: 'PPPoE secret removed successfully' };
      await this.log('REMOVE_PPPOE_SECRET', params, result);
      return result;
    } catch (error) {
      await this.log('REMOVE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to remove PPPoE: ${error.message}`);
    }
  }

  async getPppoeSecrets(router) {
    if (this.mockMode) {
      return [
        { name: 'user1', profile: 'default', disabled: false, comment: 'Mock user 1' },
        { name: 'user2', profile: 'premium', disabled: true, comment: 'Mock user 2' },
      ];
    }

    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print');
      await this.disconnect(api);
      
      return secrets.map(s => ({
        id: s['.id'],
        name: s.name,
        profile: s.profile,
        disabled: s.disabled === 'true' || s.disabled === true,
        comment: s.comment || '',
        service: s.service || 'pppoe',
      }));
    } catch (error) {
      console.error(`Failed to get PPPoE secrets from ${router.name}:`, error.message);
      throw new Error(`Failed to fetch PPPoE secrets: ${error.message}`);
    }
  }

  // --- Active Sessions ---
  async getActiveSessions(router) {
    if (this.mockMode) {
      return [
        { name: 'user1', address: '10.0.0.101', uptime: '01:23:45', bytesIn: 1234567, bytesOut: 7654321 },
      ];
    }

    try {
      const api = await this.connectToRouter(router);
      const sessions = await api.write('/ppp/active/print');
      await this.disconnect(api);
      
      return sessions.map(s => ({
        id: s['.id'],
        username: s.name,
        address: s.address,
        uptime: s.uptime,
        bytesIn: parseInt(s['bytes-in']) || 0,
        bytesOut: parseInt(s['bytes-out']) || 0,
        service: s.service,
        callerId: s['caller-id'] || '',
      }));
    } catch (error) {
      console.error(`Failed to get active sessions from ${router.name}:`, error.message);
      return [];
    }
  }

  // --- Router Info ---
  async getRouterInfo(router) {
    if (this.mockMode) {
      return {
        identity: `${router.name} (Mock)`,
        version: 'RouterOS 7.15',
        uptime: '2 weeks, 3 days, 4 hours',
        freeMemory: '125M',
        totalMemory: '256M',
        cpuLoad: '12%',
      };
    }

    try {
      const api = await this.connectToRouter(router);
      
      const identity = await api.write('/system/identity/print');
      const resource = await api.write('/system/resource/print');
      const clock = await api.write('/system/clock/print');
      
      await this.disconnect(api);

      return {
        identity: identity[0]?.name || 'Unknown',
        version: resource[0]?.version || 'Unknown',
        uptime: resource[0]?.uptime || 'Unknown',
        freeMemory: resource[0]?.['free-memory'] || 'Unknown',
        totalMemory: resource[0]?.['total-memory'] || 'Unknown',
        cpuLoad: resource[0]?.['cpu-load'] || 'Unknown',
        boardName: resource[0]?.['board-name'] || 'Unknown',
        currentTime: clock[0]?.date + ' ' + clock[0]?.time || 'Unknown',
      };
    } catch (error) {
      throw new Error(`Failed to get router info: ${error.message}`);
    }
  }

  async testConnection(router) {
    if (this.mockMode) {
      return {
        success: true,
        mock: true,
        message: 'Mock Mode Active',
        data: { 
          identity: `${router.name} (Mock)`, 
          version: '7.15 (Mock)', 
          uptime: 'N/A' 
        }
      };
    }

    try {
      const info = await this.getRouterInfo(router);
      
      return {
        success: true,
        mock: false,
        message: 'Connection successful',
        data: info
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

  // --- Simple Queue Management ---
  async getSimpleQueues(router) {
    if (this.mockMode) {
      return [
        { name: 'queue1', target: '10.0.0.101/32', maxLimit: '10M/10M', comment: 'Mock queue' },
      ];
    }

    try {
      const api = await this.connectToRouter(router);
      const queues = await api.write('/queue/simple/print');
      await this.disconnect(api);
      
      return queues.map(q => ({
        id: q['.id'],
        name: q.name,
        target: q.target,
        maxLimit: q['max-limit'] || '0/0',
        comment: q.comment || '',
        disabled: q.disabled === 'true' || q.disabled === true,
      }));
    } catch (error) {
      console.error(`Failed to get queues from ${router.name}:`, error.message);
      return [];
    }
  }

  // --- Profile Management ---
  async getProfiles(router) {
    if (this.mockMode) {
      return [
        { name: 'default', localAddress: '10.0.0.1', remoteAddress: 'pool1', rateLimit: '10M/10M' },
        { name: 'premium', localAddress: '10.0.0.1', remoteAddress: 'pool2', rateLimit: '50M/50M' },
      ];
    }

    try {
      const api = await this.connectToRouter(router);
      const profiles = await api.write('/ppp/profile/print');
      await this.disconnect(api);
      
      return profiles.map(p => ({
        id: p['.id'],
        name: p.name,
        localAddress: p['local-address'] || '',
        remoteAddress: p['remote-address'] || '',
        rateLimit: p['rate-limit'] || '0/0',
        comment: p.comment || '',
      }));
    } catch (error) {
      console.error(`Failed to get profiles from ${router.name}:`, error.message);
      return [];
    }
  }
}

module.exports = new MikroTikService();