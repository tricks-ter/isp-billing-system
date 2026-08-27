// backend/src/services/mikrotikService.js
const { RouterOSAPI } = require('routeros-api');
const fs = require('fs').promises;
const path = require('path');

class MikroTikService {
  constructor() {
    this.mockMode = process.env.MIKROTIK_MOCK_MODE === 'true';
    this.logFile = path.join(__dirname, '../../logs/mikrotik-operations.log');
    fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(() => {});
    
    // Connection pool to reuse connections
    this.connectionPool = new Map();
    this.connectionTimeout = 3000; // Reduced from 10000 to 3000ms
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

  // Get or create connection from pool
  async getConnection(router) {
    const port = parseInt(router.apiPort) || 8728;
    const poolKey = `${router.ipAddress}:${port}`;
    
    // Check if we have a valid connection in pool
    if (this.connectionPool.has(poolKey)) {
      const conn = this.connectionPool.get(poolKey);
      if (conn.isConnected && conn.api) {
        return conn.api;
      }
      // Connection is stale, remove it
      this.connectionPool.delete(poolKey);
    }

    // Create new connection
    try {
      const api = new RouterOSAPI({
        host: router.ipAddress,
        user: router.username,
        password: router.password,
        port: port,
        timeout: 5, // 5 seconds timeout
      });
      
      await api.connect();
      
      // Store in pool
      this.connectionPool.set(poolKey, {
        api,
        isConnected: true,
        createdAt: Date.now()
      });
      
      return api;
    } catch (error) {
      let extra = '';
      const ip = router.ipAddress || '';
      if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') || ip.startsWith('172.2') || ip.startsWith('172.30.') || ip.startsWith('172.31.')) {
        extra = ` Note: ${ip} is a private local IP. Remote/cloud backends cannot route directly to local subnets without a Public IP, Port Forwarding (NAT), DDNS, or VPN.`;
      }
      throw new Error(`Cannot reach RouterOS at ${router.ipAddress}:${port} (${error.message || error}).${extra}`);
    }
  }

  async connectToRouter(router) {
    if (this.mockMode) return { mock: true, router };
    return await this.getConnection(router);
  }

  async disconnect(api) {
    // Don't disconnect immediately - keep in pool for reuse
    // Connections will be cleaned up periodically
  }

  // NEW: Cleanup old connections every 5 minutes
  startConnectionCleanup() {
    setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      for (const [key, conn] of this.connectionPool.entries()) {
        if (now - conn.createdAt > maxAge) {
          try {
            if (conn.api && conn.api.close) {
              conn.api.close();
            }
          } catch (e) {
            console.error('Error closing stale connection:', e);
          }
          this.connectionPool.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // --- PPPoE Operations (NON-BLOCKING) ---
  
  async addPppoeSecret(router, username, password, profile, comment = '') {
    const params = { username, password, profile, router: router.name, comment };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret created' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      return result;
    }

    // Fire and forget - don't block the main operation
    this.executeWithTimeout(
      this._addPppoeSecret(router, username, password, profile, comment),
      params
    ).catch(err => console.error('MikroTik addPppoeSecret failed:', err.message));
    
    return { success: true, message: 'PPPoE secret creation initiated' };
  }

  async _addPppoeSecret(router, username, password, profile, comment = '') {
    try {
      const api = await this.connectToRouter(router);
      const existing = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (existing.length > 0) {
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
      const result = { success: true, message: 'PPPoE secret created successfully' };
      await this.log('ADD_PPPOE_SECRET', { username, router: router.name }, result);
      return result;
    } catch (error) {
      await this.log('ADD_PPPOE_SECRET', { username, router: router.name }, { error: error.message });
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

    this.executeWithTimeout(
      this._updatePppoeSecret(router, username, newPassword, newProfile),
      params
    ).catch(err => console.error('MikroTik updatePppoeSecret failed:', err.message));
    
    return { success: true, message: 'PPPoE secret update initiated' };
  }

  async _updatePppoeSecret(router, username, newPassword, newProfile) {
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      const id = secrets[0]['.id'];
      const commands = [`.id=${id}`];
      if (newPassword) commands.push(`=password=${newPassword}`);
      if (newProfile) commands.push(`=profile=${newProfile}`);
      await api.write('/ppp/secret/set', commands);
      const result = { success: true, message: 'PPPoE secret updated successfully' };
      await this.log('UPDATE_PPPOE_SECRET', { username, router: router.name }, result);
      return result;
    } catch (error) {
      await this.log('UPDATE_PPPOE_SECRET', { username, router: router.name }, { error: error.message });
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

    this.executeWithTimeout(
      this._disablePppoeSecret(router, username),
      params
    ).catch(err => console.error('MikroTik disablePppoeSecret failed:', err.message));
    
    return { success: true, message: 'PPPoE disable initiated' };
  }

  async _disablePppoeSecret(router, username) {
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=yes']);
      const result = { success: true, message: 'PPPoE secret disabled successfully' };
      await this.log('DISABLE_PPPOE_SECRET', { username, router: router.name }, result);
      return result;
    } catch (error) {
      await this.log('DISABLE_PPPOE_SECRET', { username, router: router.name }, { error: error.message });
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

    this.executeWithTimeout(
      this._enablePppoeSecret(router, username),
      params
    ).catch(err => console.error('MikroTik enablePppoeSecret failed:', err.message));
    
    return { success: true, message: 'PPPoE enable initiated' };
  }

  async _enablePppoeSecret(router, username) {
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      await api.write('/ppp/secret/set', [`.id=${secrets[0]['.id']}`, '=disabled=no']);
      const result = { success: true, message: 'PPPoE secret enabled successfully' };
      await this.log('ENABLE_PPPOE_SECRET', { username, router: router.name }, result);
      return result;
    } catch (error) {
      await this.log('ENABLE_PPPOE_SECRET', { username, router: router.name }, { error: error.message });
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

    this.executeWithTimeout(
      this._removePppoeSecret(router, username),
      params
    ).catch(err => console.error('MikroTik removePppoeSecret failed:', err.message));
    
    return { success: true, message: 'PPPoE removal initiated' };
  }

  async _removePppoeSecret(router, username) {
    try {
      const api = await this.connectToRouter(router);
      const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);
      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }
      await api.write('/ppp/secret/remove', [`.id=${secrets[0]['.id']}`]);
      const result = { success: true, message: 'PPPoE secret removed successfully' };
      await this.log('REMOVE_PPPOE_SECRET', { username, router: router.name }, result);
      return result;
    } catch (error) {
      await this.log('REMOVE_PPPOE_SECRET', { username, router: router.name }, { error: error.message });
      throw new Error(`Failed to remove PPPoE: ${error.message}`);
    }
  }

  // NEW: Execute with timeout wrapper
  async executeWithTimeout(promise, params) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MikroTik operation timeout')), this.connectionTimeout);
    });
    return Promise.race([promise, timeout]);
  }

  // --- Read Operations (still blocking but with timeout) ---
  
  async togglePppoeSecret(router, username, disable) {
    if (disable) {
      return this.disablePppoeSecret(router, username);
    } else {
      return this.enablePppoeSecret(router, username);
    }
  }

  async getPppoeSecretsPaginated(router, page = 1, limit = 50, search = '', status = '') {
    const params = { router: router.name, page, limit, search, status };
    
    if (this.mockMode) {
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
      let filter = [];
      if (search) filter.push(`?name=${search}`);
      const secrets = await api.write('/ppp/secret/print', filter);
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

  async removeActiveSession(router, username) {
    const params = { username, router: router.name };
    
    if (this.mockMode) {
      const result = { success: true, message: `Mock: Disconnected session ${username}` };
      await this.log('REMOVE_ACTIVE_SESSION', params, result);
      return result;
    }

    try {
      const api = await this.connectToRouter(router);
      const sessions = await api.write('/ppp/active/print', [`?name=${username}`]);
      if (sessions.length === 0) {
        throw new Error(`No active session found for ${username}`);
      }
      await api.write('/ppp/active/remove', [`.id=${sessions[0]['.id']}`]);
      const result = { success: true, message: `Session ${username} disconnected` };
      await this.log('REMOVE_ACTIVE_SESSION', params, result);
      return result;
    } catch (error) {
      await this.log('REMOVE_ACTIVE_SESSION', params, { error: error.message });
      throw new Error(`Failed to disconnect session: ${error.message}`);
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

  async getProfilesPaginated(router, page = 1, limit = 50, search = '') {
    const all = await this.getProfiles(router);
    let filtered = all.filter(p => p.name.includes(search) || p.comment.includes(search));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total };
  }

  async getSimpleQueuesPaginated(router, page = 1, limit = 50, search = '') {
    const all = await this.getSimpleQueues(router);
    let filtered = all.filter(q => q.name.includes(search) || q.comment.includes(search));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, total };
  }

  async executeCliCommand(router, commandStr) {
    const raw = (commandStr || '').trim();
    if (!raw) throw new Error('Command cannot be empty');

    if (this.mockMode) {
      const lower = raw.toLowerCase().replace(/^\/+/, '');
      if (lower.includes('resource') && lower.includes('print')) {
        return [
          {
            uptime: '14w3d12h45m',
            version: '7.15.2 (stable)',
            'free-memory': '241.5MiB',
            'total-memory': '256.0MiB',
            cpu: 'MIPS 1004Kc V2.15',
            'cpu-count': '2',
            'cpu-frequency': '880MHz',
            'cpu-load': '4%',
            'free-hdd-space': '14.2MiB',
            'total-hdd-space': '16.0MiB',
            'board-name': `${router.name || 'MikroTik'} [MOCK SIMULATOR]`,
          },
        ];
      } else if (lower.includes('ip') && lower.includes('address') && lower.includes('print')) {
        return [
          { '.id': '*1', address: '103.145.112.54/29', network: '103.145.112.48', interface: 'ether1-WAN', comment: 'WAN Upstream' },
          { '.id': '*2', address: '192.168.88.1/24', network: '192.168.88.0', interface: 'bridge-LAN', comment: 'Local Gateway' },
          { '.id': '*3', address: '10.10.0.1/24', network: '10.10.0.0', interface: 'pppoe-pool', comment: 'PPPoE Client Subnet' },
        ];
      } else if (lower.includes('interface') && lower.includes('print')) {
        return [
          { '.id': '*1', name: 'ether1-WAN', type: 'ether', mtu: '1500', macAddress: 'DC:2C:6E:11:22:33', running: 'true', disabled: 'false' },
          { '.id': '*2', name: 'ether2-LAN', type: 'ether', mtu: '1500', macAddress: 'DC:2C:6E:11:22:34', running: 'true', disabled: 'false' },
          { '.id': '*3', name: 'ether3-OLT-Uplink', type: 'ether', mtu: '1500', macAddress: 'DC:2C:6E:11:22:35', running: 'true', disabled: 'false' },
          { '.id': '*4', name: 'bridge-LAN', type: 'bridge', mtu: '1500', macAddress: 'DC:2C:6E:11:22:34', running: 'true', disabled: 'false' },
        ];
      } else if (lower.includes('ppp') && lower.includes('secret')) {
        return await this.getPppoeSecrets(router);
      } else if (lower.includes('ppp') && lower.includes('active')) {
        return await this.getActiveSessions(router);
      } else if (lower.includes('queue')) {
        return await this.getSimpleQueues(router);
      } else if (lower.includes('ping')) {
        return [
          { host: '8.8.8.8', size: 56, ttl: 118, time: '14ms', status: 'echo reply' },
          { host: '8.8.8.8', size: 56, ttl: 118, time: '12ms', status: 'echo reply' },
          { host: '8.8.8.8', size: 56, ttl: 118, time: '15ms', status: 'echo reply' },
          { host: '8.8.8.8', size: 56, ttl: 118, time: '13ms', status: 'echo reply' },
        ];
      } else {
        return [
          { status: 'success', message: `Mock execution of '${raw}' completed with code 0.` },
        ];
      }
    }

    try {
      const api = await this.connectToRouter(router);
      const cmd = raw.startsWith('/') ? raw : `/${raw}`;
      const result = await api.write(cmd);
      return result;
    } catch (error) {
      throw new Error(`RouterOS command failed: ${error.message}`);
    }
  }
}

const mikrotikService = new MikroTikService();
mikrotikService.startConnectionCleanup();

module.exports = mikrotikService;