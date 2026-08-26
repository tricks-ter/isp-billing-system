// backend/src/services/olt/mockOltDriver.js
const OltDriverBase = require('./oltDriverBase');

// In-memory persistent mock state per OLT ID
const mockStore = new Map();

class MockOltDriver extends OltDriverBase {
  constructor(olt) {
    super(olt);
    this.oltId = olt.id || 1;
    this.initMockData();
  }

  initMockData() {
    if (mockStore.has(this.oltId)) return;

    const brand = this.olt.brand || 'BDCOM';
    const isGpon = this.olt.ponType === 'GPON';
    const portCount = this.olt.ponPortCount || 4;

    const ports = [];
    for (let p = 1; p <= portCount; p++) {
      const portName = isGpon ? `GPON0/${p}` : `EPON0/${p}`;
      ports.push({
        portNumber: p,
        portName,
        adminStatus: 'UP',
        operStatus: 'UP',
        maxOnus: isGpon ? 128 : 64,
        sfpModel: isGpon ? 'GPON-OLT-CLASS-C+' : 'EPON-OLT-PX20+++',
        txPower: +(4.2 + (Math.random() * 0.8 - 0.4)).toFixed(2), // ~+4.2 dBm
        rxPower: +(-21.5 + (Math.random() * 2 - 1)).toFixed(2),
        temperature: +(41.0 + (Math.random() * 3)).toFixed(1), // ~42°C
        voltage: +(3.28 + (Math.random() * 0.05)).toFixed(2), // ~3.3V
        current: +(13.5 + (Math.random() * 1.5)).toFixed(1), // ~14mA
        description: `Distribution PON ${p} - Zone ${String.fromCharCode(64 + p)}`,
      });
    }

    // Seed mock registered ONUs
    const onus = [];
    const models = ['V2801SG', 'HG6143D', 'Realtek ONU 1GE', 'VSOL V2804', 'Huawei EG8141A5'];
    const names = [
      'Rahim Uddin', 'Karim Mia', 'Shahidul Islam', 'Fatema Begum',
      'Arif Hossain', 'Sumon Roy', 'Farhana Akter', 'Tanvir Ahmed',
      'Nasir Uddin', 'Mizanur Rahman', 'Rokeya Sultana', 'Kamal Pasha'
    ];

    let onuCounter = 1;
    for (let p = 1; p <= portCount; p++) {
      const onusOnPort = p === 1 ? 5 : p === 2 ? 4 : 3;
      for (let slot = 1; slot <= onusOnPort; slot++) {
        const randVal = Math.random();
        let status = 'ONLINE';
        let rxPower = -19.5 - Math.random() * 4.0; // Normal: -19.5 to -23.5 dBm
        let lastDeregister = null;

        if (randVal < 0.1) {
          status = 'LOS';
          rxPower = -32.0;
          lastDeregister = 'Loss of Signal (Fiber cut / unplugged)';
        } else if (randVal < 0.2) {
          status = 'OFFLINE';
          rxPower = null;
          lastDeregister = 'Power Off (Dying Gasp)';
        } else if (randVal < 0.35) {
          rxPower = -26.5 - Math.random() * 2.0; // Marginal / warning: -26.5 to -28.5 dBm
        }

        const macHex = Array.from({ length: 6 }, () => 
          Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
        ).join(':');

        const serial = `BDCM${Math.floor(10000000 + Math.random() * 90000000)}`;

        onus.push({
          portNumber: p,
          onuId: slot,
          macAddress: isGpon ? null : macHex,
          serialNumber: isGpon ? serial : null,
          name: names[(onuCounter - 1) % names.length] || `Customer ${onuCounter}`,
          model: models[onuCounter % models.length],
          vendor: brand,
          status,
          rxPower: rxPower ? +rxPower.toFixed(2) : null,
          txPower: status === 'ONLINE' ? +(2.1 + (Math.random() * 0.6 - 0.3)).toFixed(2) : null,
          oltRxPower: status === 'ONLINE' ? +(-22.0 + (Math.random() * 2 - 1)).toFixed(2) : null,
          distance: Math.floor(450 + Math.random() * 2500), // 450m to 2950m
          vlanId: 100 + p,
          vlanMode: 'TAG',
          isAuthorized: true,
          lastOnline: status === 'ONLINE' ? new Date(Date.now() - Math.floor(Math.random() * 86400000)) : new Date(Date.now() - 3600000 * 5),
          lastOffline: status !== 'ONLINE' ? new Date(Date.now() - 3600000 * 2) : null,
          lastDeregisterReason: lastDeregister,
        });
        onuCounter++;
      }
    }

    // Seed mock unregistered ONUs (discovered on fiber splitters)
    const unregistered = [
      {
        portNumber: 1,
        macAddress: 'E0:67:B3:AA:BB:CC',
        serialNumber: 'BDCM99887766',
        model: 'V2801SG 1GE XPON',
        vendor: 'V-SOL',
        rxPower: -20.4,
        firstSeen: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        portNumber: 2,
        macAddress: '70:A5:6A:11:22:33',
        serialNumber: 'ECOM55443322',
        model: 'ECOM Mini ONU',
        vendor: 'ECOM',
        rxPower: -22.8,
        firstSeen: new Date(Date.now() - 1000 * 60 * 35),
      }
    ];

    mockStore.set(this.oltId, {
      ports,
      onus,
      unregistered,
      info: {
        brand,
        hardwareModel: brand === 'BDCOM' ? (isGpon ? 'GP3600-08' : 'P3310D-2AC') : 'ECOM-EPON-8P',
        firmwareVersion: brand === 'BDCOM' ? 'Version 10.1.0E Build 78521' : 'V3.2.1_R2108',
        uptime: '42 days, 14 hours, 28 mins',
        cpuUsage: 14.5,
        memoryUsage: 36.2,
        temperature: 39.0,
      }
    });
  }

  getStore() {
    this.initMockData();
    return mockStore.get(this.oltId);
  }

  async testConnection() {
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      message: `Successfully connected to ${this.olt.brand} OLT (${this.olt.ipAddress}) via Mock Driver`,
      latencyMs: 12,
    };
  }

  async getDeviceInfo() {
    const store = this.getStore();
    return {
      ...store.info,
      ipAddress: this.olt.ipAddress,
      ponPortCount: this.olt.ponPortCount || store.ports.length,
      uplinkPortCount: this.olt.uplinkPortCount || 2,
      activeOnus: store.onus.filter(o => o.status === 'ONLINE').length,
      totalOnus: store.onus.length,
      unregisteredCount: store.unregistered.length,
    };
  }

  async getPonPorts() {
    const store = this.getStore();
    return store.ports.map(p => {
      const portOnus = store.onus.filter(o => o.portNumber === p.portNumber);
      return {
        ...p,
        totalOnus: portOnus.length,
        onlineOnus: portOnus.filter(o => o.status === 'ONLINE').length,
        offlineOnus: portOnus.filter(o => o.status === 'OFFLINE' || o.status === 'LOS').length,
      };
    });
  }

  async getRegisteredOnus(portNumber = null) {
    const store = this.getStore();
    let list = store.onus;
    if (portNumber) {
      list = list.filter(o => o.portNumber === parseInt(portNumber));
    }
    return list;
  }

  async getUnregisteredOnus() {
    const store = this.getStore();
    return store.unregistered;
  }

  async getOnuOpticalDiagnostics(portNumber, onuId) {
    const store = this.getStore();
    const onu = store.onus.find(o => o.portNumber === parseInt(portNumber) && o.onuId === parseInt(onuId));
    if (!onu) throw new Error(`ONU not found at port ${portNumber}, id ${onuId}`);

    // Introduce slight natural fluctuations for realism
    const rx = onu.rxPower ? +(onu.rxPower + (Math.random() * 0.2 - 0.1)).toFixed(2) : null;
    return {
      portNumber: onu.portNumber,
      onuId: onu.onuId,
      macAddress: onu.macAddress,
      serialNumber: onu.serialNumber,
      name: onu.name,
      status: onu.status,
      rxPower: rx,
      txPower: onu.txPower,
      oltRxPower: onu.oltRxPower,
      distance: onu.distance,
      temperature: +(42.5 + Math.random() * 1.5).toFixed(1),
      voltage: +(3.3 + Math.random() * 0.04).toFixed(2),
      signalQuality: !rx || rx < -27 ? 'CRITICAL' : rx < -24 ? 'WARNING' : 'GOOD',
      measuredAt: new Date().toISOString(),
    };
  }

  async authorizeOnu(data) {
    const store = this.getStore();
    const portNumber = parseInt(data.portNumber);
    const onuId = parseInt(data.onuId) || (store.onus.filter(o => o.portNumber === portNumber).length + 1);

    // Remove from unregistered if present
    store.unregistered = store.unregistered.filter(u => 
      u.macAddress !== data.macAddress && u.serialNumber !== data.serialNumber
    );

    const newOnu = {
      portNumber,
      onuId,
      macAddress: data.macAddress,
      serialNumber: data.serialNumber,
      name: data.name || `Customer-Port${portNumber}-${onuId}`,
      model: data.model || 'XPON 1GE ONU',
      vendor: this.olt.brand,
      status: 'ONLINE',
      rxPower: -20.5,
      txPower: 2.2,
      oltRxPower: -21.8,
      distance: 680,
      vlanId: parseInt(data.vlanId) || 100,
      vlanMode: data.vlanMode || 'TAG',
      isAuthorized: true,
      lastOnline: new Date(),
      lastOffline: null,
      lastDeregisterReason: null,
    };

    // Remove existing if collision
    store.onus = store.onus.filter(o => !(o.portNumber === portNumber && o.onuId === onuId));
    store.onus.push(newOnu);

    return {
      success: true,
      message: `ONU [${data.macAddress || data.serialNumber}] successfully authorized on ${this.olt.brand} Port ${portNumber}:${onuId}`,
      onu: newOnu
    };
  }

  async unauthorizeOnu(portNumber, onuId, macOrSn = null) {
    const store = this.getStore();
    const p = parseInt(portNumber);
    const id = parseInt(onuId);

    const target = store.onus.find(o => o.portNumber === p && o.onuId === id);
    if (!target) throw new Error('ONU not found');

    store.onus = store.onus.filter(o => !(o.portNumber === p && o.onuId === id));

    // Put back to unregistered queue
    store.unregistered.push({
      portNumber: p,
      macAddress: target.macAddress,
      serialNumber: target.serialNumber,
      model: target.model,
      vendor: target.vendor,
      rxPower: target.rxPower || -21.0,
      firstSeen: new Date(),
    });

    return {
      success: true,
      message: `ONU at Port ${portNumber}:${onuId} de-authorized and unbound from OLT`,
    };
  }

  async rebootOnu(portNumber, onuId) {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      message: `Reboot command sent to ONU on Port ${portNumber}:${onuId}. Device will restart in 10 seconds.`,
    };
  }

  async toggleOnuPort(portNumber, onuId, disable = false) {
    const store = this.getStore();
    const p = parseInt(portNumber);
    const id = parseInt(onuId);

    const onu = store.onus.find(o => o.portNumber === p && o.onuId === id);
    if (onu) {
      onu.status = disable ? 'OFFLINE' : 'ONLINE';
      onu.lastDeregisterReason = disable ? 'Admin Disabled (Port Cutoff)' : null;
    }

    return {
      success: true,
      message: `ONU Port ${portNumber}:${onuId} ${disable ? 'disabled' : 'enabled'} successfully`,
    };
  }

  async executeRawCli(command) {
    const cmd = command.trim();
    const isBdcom = this.olt.brand === 'BDCOM';

    if (cmd.startsWith('show version')) {
      return isBdcom
        ? `BDCOM(tm) P3310D Software, Version 10.1.0E Build 78521\nCopyright by Shanghai Baud Data Communication Co, Ltd.\nCompiled: 2024-03-15 by software team\nROM: System Bootstrap, Version 0.4.2\nSystem Uptime is 42 days, 14 hours, 28 minutes\nSystem CPU 14%, Memory 36%\nHardware P3310D with 4 EPON ports, 4 GE SFP, 4 GE TX`
        : `ECOM EPON OLT Software V3.2.1_R2108\nDevice Model: ECOM-EPON-8P\nSystem Uptime: 38 days, 06 hours\nCPU Usage: 12.0%, Memory Usage: 32.5%`;
    }

    if (cmd.startsWith('show epon active-onu') || cmd.startsWith('show onu active')) {
      const store = this.getStore();
      let out = `Interface  ONU-ID  MAC-Address        Status  Distance(m)  RxPower(dBm)\n------------------------------------------------------------------------\n`;
      store.onus.filter(o => o.status === 'ONLINE').forEach(o => {
        out += `EPON0/${o.portNumber}     ${String(o.onuId).padEnd(6)}  ${(o.macAddress || o.serialNumber || '-').padEnd(17)}  ${o.status.padEnd(6)}  ${String(o.distance || 0).padEnd(11)}  ${o.rxPower || '-'}\n`;
      });
      return out;
    }

    if (cmd.startsWith('show epon optical-transceiver-diagnosis') || cmd.startsWith('show optical')) {
      return `EPON0/1:1 Optical Transceiver Diagnostic:\n  Operating Temp    : 43.12 C\n  Supply Voltage    : 3.31 V\n  Bias Current      : 14.20 mA\n  Tx Power          : +2.15 dBm\n  Rx Power          : -21.40 dBm\n  Status            : Normal`;
    }

    if (cmd.startsWith('write') || cmd.startsWith('save')) {
      return `Saving running-config to startup-config...\n[OK] Configuration saved successfully.`;
    }

    return `Command: "${command}" executed successfully.\nDevice response: OK.`;
  }
}

module.exports = MockOltDriver;

