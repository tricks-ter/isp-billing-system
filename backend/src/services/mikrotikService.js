// backend/src/services/mikrotikService.js
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
      try { api.close(); } catch (e) { console.error('Disconnect error:', e); }
    }
  }

  // --- Existing methods (kept for backward compatibility) ---
  async addPppoeSecret(router, username, password, profile, comment = '') {
    const params = { username, password, profile, router: router.name, comment };
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret created' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
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

  // --- NEW: Toggle PPPoE secret (enable/disable) ---
  async togglePppoeSecret(router, username, disable) {
    if (disable) {
      return this.disablePppoeSecret(router, username);
    } else {
      return this.enablePppoeSecret(router, username);
    }
  }

  // --- NEW: Paginated & filterable PPPoE secrets ---
  async getPppoeSecretsPaginated(router, page = 1, limit = 50, search = '', status = '') {
    const params = { router: router.name, page, limit, search, status };
    if (this.mockMode) {
      // Generate mock data
      const all = [];
      for (let i = 1; i <= 250; i++) {
        all.push({
          id: `mock_${i}`,
          name: `user${i}`,
          profile: i % 2 === 0 ? 'default' : 'premium',
          disabled: i % 5 === 0,
          comment: i % 3 === 0 ? 'mock comment' : '',
        });
      }
      // Apply search filter
      let filtered = all.filter(s => s.name.includes(search) || (s.comment && s.comment.includes(search)));
      if (status === 'enabled') filtered = filtered.filter(s => !s.disabled);
      else if (status === 'disabled') filtered = filtered.filter(s => s.disabled);
      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      await this.log('GET_PPPOE_SECRETS_PAGINATED', params, { total, count: data.length });
      return { data, total };
    }

    try {
      const api = await this.connectToRouter(router);
      // Build filter query
      let filter = [];
      if (search) filter.push(`?name=${search}`);
      // Note: RouterOS API doesn't support status filter directly, we'll filter in code
      const secrets = await api.write('/ppp/secret/print', filter);
      await this.disconnect(api);

      let filtered = secrets.map(s => ({
        id: s['.id'],
        name: s.name,
        profile: s.profile,
        disabled: s.disabled === 'true' || s.disabled === true,
        comment: s.comment || '',
        service: s.service || 'pppoe',
      }));

      if (search) filtered = filtered.filter(s => s.name.includes(search) || s.comment.includes(search));
      if (status === 'enabled') filtered = filtered.filter(s => !s.disabled);
      else if (status === 'disabled') filtered = filtered.filter(s => s.disabled);

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      await this.log('GET_PPPOE_SECRETS_PAGINATED', params, { total, count: data.length });
      return { data, total };
    } catch (error) {
      await this.log('GET_PPPOE_SECRETS_PAGINATED', params, { error: error.message });
      throw new Error(`Failed to fetch PPPoE secrets: ${error.message}`);
    }
  }

  // --- NEW: Paginated active sessions ---
  async getActiveSessionsPaginated(router, page = 1, limit = 50, search = '') {
    const params = { router: router.name, page, limit, search };
    if (this.mockMode) {
      const all = [];
      for (let i = 1; i <= 120; i++) {
        all.push({
          id: `session_${i}`,
          username: `user${i}`,
          address: `192.168.88.${i}`,
          uptime: `${Math.floor(i/10)}h ${i%60}m`,
          bytesIn: i * 1000000,
          bytesOut: i * 2000000,
        });
      }
      let filtered = all.filter(s => s.username.includes(search));
      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      await this.log('GET_ACTIVE_SESSIONS_PAGINATED', params, { total, count: data.length });
      return { data, total };
    }

    try {
      const api = await this.connectToRouter(router);
      const sessions = await api.write('/ppp/active/print');
      await this.disconnect(api);

      let filtered = sessions.map(s => ({
        id: s['.id'],
        username: s.name,
        address: s.address,
        uptime: s.uptime,
        bytesIn: parseInt(s['bytes-in']) || 0,
        bytesOut: parseInt(s['bytes-out']) || 0,
        service: s.service,
        callerId: s['caller-id'] || '',
      }));

      if (search) filtered = filtered.filter(s => s.username.includes(search));

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      await this.log('GET_ACTIVE_SESSIONS_PAGINATED', params, { total, count: data.length });
      return { data, total };
    } catch (error) {
      await this.log('GET_ACTIVE_SESSIONS_PAGINATED', params, { error: error.message });
      throw new Error(`Failed to fetch active sessions: ${error.message}`);
    }
  }

  // --- NEW: Disconnect active session ---
  async removeActiveSession(router, username) {
    const params = { username, router: router.name };
    if (this.mockMode) {
      const result = { success: true, message: `Mock: Disconnected session ${username}` };
      await this.log('REMOVE_ACTIVE_SESSION', params, result);
      return result;
    }
    try {
      const api = await this.connectToRouter(router);
      // Find session by username
      const sessions = await api.write('/ppp/active/print', [`?name=${username}`]);
      if (sessions.length === 0) {
        await this.disconnect(api);
        throw new Error(`No active session found for ${username}`);
      }
      await api.write('/ppp/active/remove', [`.id=${sessions[0]['.id']}`]);
      await this.disconnect(api);
      const result = { success: true, message: `Session ${username} disconnected` };
      await this.log('REMOVE_ACTIVE_SESSION', params, result);
      return result;
    } catch (error) {
      await this.log('REMOVE_ACTIVE_SESSION', params, { error: error.message });
      throw new Error(`Failed to disconnect session: ${error.message}`);
    }
  }

  // --- Existing getters (unchanged but kept for other uses) ---
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
      await this.disconnect(api);
      return {
        identity: identity[0]?.name || 'Unknown',
        version: resource[0]?.version || 'Unknown',
        uptime: resource[0]?.uptime || 'Unknown',
        freeMemory: resource[0]?.['free-memory'] || 'Unknown',
        totalMemory: resource[0]?.['total-memory'] || 'Unknown',
        cpuLoad: resource[0]?.['cpu-load'] || 'Unknown',
        boardName: resource[0]?.['board-name'] || 'Unknown',
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
        data: { identity: `${router.name} (Mock)`, version: '7.15 (Mock)', uptime: 'N/A' }
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

  // --- NEW: Paginated profiles (for consistency) ---
  async getProfilesPaginated(router, page = 1, limit = 50, search = '') {
    const all = await this.getProfiles(router);
    let filtered = all.filter(p => p.name.includes(search) || p.comment.includes(search));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total };
  }

  // --- NEW: Paginated queues ---
  async getSimpleQueuesPaginated(router, page = 1, limit = 50, search = '') {
    const all = await this.getSimpleQueues(router);
    let filtered = all.filter(q => q.name.includes(search) || q.comment.includes(search));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total };
  }
}

module.exports = new MikroTikService();