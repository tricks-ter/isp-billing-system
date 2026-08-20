// FILE: ./backend/src/services/settingsService.js
const prisma = require('../config/db');

class SettingsService {
  async getSetting(key) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async setSetting(key, value, userId) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SETTING',
        details: JSON.stringify({ key, value }),
      },
    });

    return setting;
  }

  async getMikrotikMockMode() {
    const setting = await this.getSetting('MIKROTIK_MOCK_MODE');
    if (setting === null) {
      return process.env.MIKROTIK_MOCK_MODE === 'true';
    }
    return setting === 'true';
  }

  async setMikrotikMockMode(enabled, userId) {
    await this.setSetting('MIKROTIK_MOCK_MODE', enabled ? 'true' : 'false', userId);
    return { mockMode: enabled };
  }

  async getSmsMockMode() {
    const setting = await this.getSetting('SMS_MOCK_MODE');
    if (setting === null) {
      return process.env.SMS_MOCK_MODE !== 'false';
    }
    return setting === 'true';
  }

  async setSmsMockMode(enabled, userId) {
    await this.setSetting('SMS_MOCK_MODE', enabled ? 'true' : 'false', userId);
    return { mockMode: enabled };
  }

  async getAllSettings() {
    const settings = await prisma.systemSetting.findMany();
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    return result;
  }
}

module.exports = new SettingsService();