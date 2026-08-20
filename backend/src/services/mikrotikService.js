const RouterOSAPI = require('routeros-api');
const fs = require('fs').promises;
const path = require('path');

class MikroTikService {
  constructor() {
    this.mockMode = process.env.MIKROTIK_MOCK_MODE === 'true';
    this.logFile = path.join(__dirname, '../../logs/mikrotik-operations.log');
    
    // Ensure logs directory exists
    fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(() => {});
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

  async connect(router) {
    if (this.mockMode) {
      console.log(`[MOCK] Connecting to router ${router.name} (${router.ipAddress})`);
      return { mock: true, router };
    }

    const connector = new RouterOSAPI.RouterOSAPI();
    const connection = await connector.connect({
      host: router.ipAddress,
      user: router.username,
      password: router.password,
      port: router.apiPort || 8728,
    });

    return connection;
  }

  async disconnect(connection) {
    if (this.mockMode) {
      console.log('[MOCK] Disconnecting from router');
      return;
    }

    if (connection && connection.close) {
      connection.close();
    }
  }

  async addPppoeSecret(router, username, password, profile) {
    const params = { username, password, profile };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret created' };
      await this.log('ADD_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Added PPPoE secret: ${username}`);
      return result;
    }

    try {
      const connection = await this.connect(router);
      const api = connection;
      
      const result = await api.write('/ppp/secret/add', {
        name: username,
        password: password,
        service: 'pppoe',
        profile: profile,
      });

      await this.disconnect(connection);
      await this.log('ADD_PPPOE_SECRET', params, result);
      
      return { success: true, data: result };
    } catch (error) {
      await this.log('ADD_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to add PPPoE secret: ${error.message}`);
    }
  }

  async disablePppoeSecret(router, username) {
    const params = { username };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret disabled' };
      await this.log('DISABLE_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Disabled PPPoE secret: ${username}`);
      return result;
    }

    try {
      const connection = await this.connect(router);
      const api = connection;
      
      // First, find the secret by username
      const secrets = await api.write('/ppp/secret/print', {
        '?name': username,
      });

      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }

      const secretId = secrets[0]['.id'];

      // Disable the secret
      const result = await api.write('/ppp/secret/set', {
        '.id': secretId,
        'disabled': 'yes',
      });

      await this.disconnect(connection);
      await this.log('DISABLE_PPPOE_SECRET', params, result);
      
      return { success: true, data: result };
    } catch (error) {
      await this.log('DISABLE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to disable PPPoE secret: ${error.message}`);
    }
  }

  async enablePppoeSecret(router, username) {
    const params = { username };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret enabled' };
      await this.log('ENABLE_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Enabled PPPoE secret: ${username}`);
      return result;
    }

    try {
      const connection = await this.connect(router);
      const api = connection;
      
      // Find the secret
      const secrets = await api.write('/ppp/secret/print', {
        '?name': username,
      });

      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }

      const secretId = secrets[0]['.id'];

      // Enable the secret
      const result = await api.write('/ppp/secret/set', {
        '.id': secretId,
        'disabled': 'no',
      });

      await this.disconnect(connection);
      await this.log('ENABLE_PPPOE_SECRET', params, result);
      
      return { success: true, data: result };
    } catch (error) {
      await this.log('ENABLE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to enable PPPoE secret: ${error.message}`);
    }
  }

  async removePppoeSecret(router, username) {
    const params = { username };
    
    if (this.mockMode) {
      const result = { success: true, message: 'Mock: PPPoE secret removed' };
      await this.log('REMOVE_PPPOE_SECRET', params, result);
      console.log(`[MOCK] Removed PPPoE secret: ${username}`);
      return result;
    }

    try {
      const connection = await this.connect(router);
      const api = connection;
      
      // Find the secret
      const secrets = await api.write('/ppp/secret/print', {
        '?name': username,
      });

      if (secrets.length === 0) {
        throw new Error(`PPPoE secret not found: ${username}`);
      }

      const secretId = secrets[0]['.id'];

      // Remove the secret
      const result = await api.write('/ppp/secret/remove', {
        '.id': secretId,
      });

      await this.disconnect(connection);
      await this.log('REMOVE_PPPOE_SECRET', params, result);
      
      return { success: true, data: result };
    } catch (error) {
      await this.log('REMOVE_PPPOE_SECRET', params, { error: error.message });
      throw new Error(`Failed to remove PPPoE secret: ${error.message}`);
    }
  }
}

module.exports = new MikroTikService();