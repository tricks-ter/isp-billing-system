// backend/src/services/oltService.js
const prisma = require('../config/db');
const OltFactory = require('./olt/oltFactory');

class OltService {
  async getAllOlts() {
    const olts = await prisma.olt.findMany({
      include: {
        _count: {
          select: {
            ponPorts: true,
            onus: true,
            customers: true,
          },
        },
        ponPorts: {
          select: {
            portNumber: true,
            adminStatus: true,
            operStatus: true,
            txPower: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate online/offline ONU stats per OLT
    const oltsWithStats = await Promise.all(
      olts.map(async (olt) => {
        const [onlineOnus, offlineOnus, losOnus] = await Promise.all([
          prisma.onu.count({ where: { oltId: olt.id, status: 'ONLINE' } }),
          prisma.onu.count({ where: { oltId: olt.id, status: 'OFFLINE' } }),
          prisma.onu.count({ where: { oltId: olt.id, status: 'LOS' } }),
        ]);

        return {
          ...olt,
          onlineOnus,
          offlineOnus,
          losOnus,
        };
      })
    );

    return oltsWithStats;
  }

  async getOltById(id) {
    const olt = await prisma.olt.findUnique({
      where: { id: parseInt(id) },
      include: {
        ponPorts: {
          orderBy: { portNumber: 'asc' },
          include: {
            _count: { select: { onus: true } },
          },
        },
        _count: {
          select: {
            onus: true,
            customers: true,
          },
        },
      },
    });
    if (!olt) throw new Error('OLT device not found');

    const [onlineOnus, offlineOnus, losOnus] = await Promise.all([
      prisma.onu.count({ where: { oltId: olt.id, status: 'ONLINE' } }),
      prisma.onu.count({ where: { oltId: olt.id, status: 'OFFLINE' } }),
      prisma.onu.count({ where: { oltId: olt.id, status: 'LOS' } }),
    ]);

    return {
      ...olt,
      onlineOnus,
      offlineOnus,
      losOnus,
    };
  }

  async createOlt(data, userId) {
    const portCount = parseInt(data.ponPortCount) || 4;
    const isGpon = data.ponType === 'GPON';

    const olt = await prisma.$transaction(async (tx) => {
      const createdOlt = await tx.olt.create({
        data: {
          name: data.name,
          brand: data.brand || 'BDCOM',
          ponType: data.ponType || 'EPON',
          ipAddress: data.ipAddress,
          snmpCommunity: data.snmpCommunity || 'public',
          snmpPort: parseInt(data.snmpPort) || 161,
          cliProtocol: data.cliProtocol || 'TELNET',
          cliPort: parseInt(data.cliPort) || 23,
          username: data.username || 'admin',
          password: data.password || 'admin',
          enablePassword: data.enablePassword || null,
          ponPortCount: portCount,
          uplinkPortCount: parseInt(data.uplinkPortCount) || 2,
          location: data.location || null,
          isMock: data.isMock !== undefined ? data.isMock : true,
          status: 'ONLINE',
          isActive: true,
        },
      });

      // Auto-create PON ports
      const portEntries = [];
      for (let p = 1; p <= portCount; p++) {
        const portName = isGpon ? `GPON0/${p}` : `EPON0/${p}`;
        portEntries.push({
          oltId: createdOlt.id,
          portNumber: p,
          portName,
          adminStatus: 'UP',
          operStatus: 'UP',
          maxOnus: isGpon ? 128 : 64,
          sfpModel: isGpon ? 'GPON-OLT-CLASS-C+' : 'EPON-OLT-PX20+++',
          txPower: 4.5,
          description: `PON Port ${p}`,
        });
      }

      await tx.ponPort.createMany({ data: portEntries });

      return createdOlt;
    });

    // Auto-sync initial state from driver (non-blocking)
    this.syncOlt(olt.id, userId).catch((err) => {
      console.warn(`Initial sync for OLT ${olt.id} failed:`, err.message);
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_OLT',
        details: JSON.stringify({ oltId: olt.id, name: olt.name, brand: olt.brand, ipAddress: olt.ipAddress }),
      },
    });

    return olt;
  }

  async updateOlt(id, data, userId) {
    const oltId = parseInt(id);
    const existing = await prisma.olt.findUnique({ where: { id: oltId } });
    if (!existing) throw new Error('OLT not found');

    const updated = await prisma.olt.update({
      where: { id: oltId },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        brand: data.brand !== undefined ? data.brand : existing.brand,
        ponType: data.ponType !== undefined ? data.ponType : existing.ponType,
        ipAddress: data.ipAddress !== undefined ? data.ipAddress : existing.ipAddress,
        snmpCommunity: data.snmpCommunity !== undefined ? data.snmpCommunity : existing.snmpCommunity,
        snmpPort: data.snmpPort ? parseInt(data.snmpPort) : existing.snmpPort,
        cliProtocol: data.cliProtocol !== undefined ? data.cliProtocol : existing.cliProtocol,
        cliPort: data.cliPort ? parseInt(data.cliPort) : existing.cliPort,
        username: data.username !== undefined ? data.username : existing.username,
        password: data.password !== undefined ? data.password : existing.password,
        enablePassword: data.enablePassword !== undefined ? data.enablePassword : existing.enablePassword,
        ponPortCount: data.ponPortCount ? parseInt(data.ponPortCount) : existing.ponPortCount,
        uplinkPortCount: data.uplinkPortCount ? parseInt(data.uplinkPortCount) : existing.uplinkPortCount,
        location: data.location !== undefined ? data.location : existing.location,
        isMock: data.isMock !== undefined ? data.isMock : existing.isMock,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_OLT',
        details: JSON.stringify({ oltId, changes: data }),
      },
    });

    return updated;
  }

  async deleteOlt(id, userId) {
    const oltId = parseInt(id);
    const olt = await prisma.olt.findUnique({
      where: { id: oltId },
      include: { _count: { select: { customers: true } } },
    });
    if (!olt) throw new Error('OLT not found');

    if (olt._count.customers > 0) {
      throw new Error(`Cannot delete OLT with ${olt._count.customers} assigned customers. Reassign customers first.`);
    }

    await prisma.olt.delete({ where: { id: oltId } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_OLT',
        details: JSON.stringify({ oltId, name: olt.name }),
      },
    });

    return { success: true, message: `OLT "${olt.name}" deleted successfully` };
  }

  async testConnection(id) {
    const olt = await prisma.olt.findUnique({ where: { id: parseInt(id) } });
    if (!olt) throw new Error('OLT not found');
    const driver = OltFactory.getDriver(olt);
    return await driver.testConnection();
  }

  async syncOlt(id, userId = null) {
    const oltId = parseInt(id);
    const olt = await prisma.olt.findUnique({
      where: { id: oltId },
      include: { ponPorts: true },
    });
    if (!olt) throw new Error('OLT not found');

    const driver = OltFactory.getDriver(olt);

    try {
      const [deviceInfo, driverPorts, driverOnus] = await Promise.all([
        driver.getDeviceInfo(),
        driver.getPonPorts(),
        driver.getRegisteredOnus(),
      ]);

      // Update OLT state
      await prisma.olt.update({
        where: { id: oltId },
        data: {
          hardwareModel: deviceInfo.hardwareModel || olt.hardwareModel,
          firmwareVersion: deviceInfo.firmwareVersion || olt.firmwareVersion,
          uptime: deviceInfo.uptime || olt.uptime,
          cpuUsage: deviceInfo.cpuUsage !== undefined ? deviceInfo.cpuUsage : olt.cpuUsage,
          temperature: deviceInfo.temperature !== undefined ? deviceInfo.temperature : olt.temperature,
          status: 'ONLINE',
          lastSyncAt: new Date(),
        },
      });

      // Update PON Ports
      for (const dp of driverPorts) {
        const existingPort = olt.ponPorts.find((p) => p.portNumber === dp.portNumber);
        if (existingPort) {
          await prisma.ponPort.update({
            where: { id: existingPort.id },
            data: {
              adminStatus: dp.adminStatus || 'UP',
              operStatus: dp.operStatus || 'UP',
              txPower: dp.txPower !== undefined ? dp.txPower : existingPort.txPower,
              rxPower: dp.rxPower !== undefined ? dp.rxPower : existingPort.rxPower,
              temperature: dp.temperature !== undefined ? dp.temperature : existingPort.temperature,
              voltage: dp.voltage !== undefined ? dp.voltage : existingPort.voltage,
              current: dp.current !== undefined ? dp.current : existingPort.current,
            },
          });
        }
      }

      // Sync ONUs into database
      for (const dOnu of driverOnus) {
        const ponPort = olt.ponPorts.find((p) => p.portNumber === dOnu.portNumber);

        await prisma.onu.upsert({
          where: {
            oltId_portNumber_onuId: {
              oltId,
              portNumber: dOnu.portNumber,
              onuId: dOnu.onuId,
            },
          },
          update: {
            macAddress: dOnu.macAddress || null,
            serialNumber: dOnu.serialNumber || null,
            name: dOnu.name || undefined,
            model: dOnu.model || undefined,
            status: dOnu.status || 'ONLINE',
            rxPower: dOnu.rxPower !== undefined ? dOnu.rxPower : undefined,
            txPower: dOnu.txPower !== undefined ? dOnu.txPower : undefined,
            oltRxPower: dOnu.oltRxPower !== undefined ? dOnu.oltRxPower : undefined,
            distance: dOnu.distance !== undefined ? dOnu.distance : undefined,
            vlanId: dOnu.vlanId !== undefined ? dOnu.vlanId : undefined,
            ponPortId: ponPort ? ponPort.id : null,
            lastOnline: dOnu.status === 'ONLINE' ? new Date() : undefined,
          },
          create: {
            oltId,
            ponPortId: ponPort ? ponPort.id : null,
            portNumber: dOnu.portNumber,
            onuId: dOnu.onuId,
            macAddress: dOnu.macAddress || null,
            serialNumber: dOnu.serialNumber || null,
            name: dOnu.name || `ONU-${dOnu.portNumber}:${dOnu.onuId}`,
            model: dOnu.model || 'XPON ONU',
            vendor: olt.brand,
            status: dOnu.status || 'ONLINE',
            rxPower: dOnu.rxPower || -21.0,
            txPower: dOnu.txPower || 2.1,
            oltRxPower: dOnu.oltRxPower || -22.0,
            distance: dOnu.distance || 500,
            vlanId: dOnu.vlanId || 100,
            isAuthorized: true,
          },
        });
      }

      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'SYNC_OLT',
            details: JSON.stringify({ oltId, syncedOnus: driverOnus.length }),
          },
        });
      }

      return {
        success: true,
        message: `OLT synced successfully. ${driverOnus.length} ONUs and ${driverPorts.length} PON ports updated.`,
      };
    } catch (error) {
      await prisma.olt.update({
        where: { id: oltId },
        data: { status: 'OFFLINE' },
      });
      throw new Error(`OLT sync failed: ${error.message}`);
    }
  }

  async getPonPorts(oltId) {
    const olt = await prisma.olt.findUnique({
      where: { id: parseInt(oltId) },
      include: {
        ponPorts: {
          orderBy: { portNumber: 'asc' },
          include: {
            _count: { select: { onus: true } },
          },
        },
      },
    });
    if (!olt) throw new Error('OLT not found');

    const portsWithStats = await Promise.all(
      olt.ponPorts.map(async (port) => {
        const [onlineCount, offlineCount, losCount] = await Promise.all([
          prisma.onu.count({ where: { oltId: olt.id, portNumber: port.portNumber, status: 'ONLINE' } }),
          prisma.onu.count({ where: { oltId: olt.id, portNumber: port.portNumber, status: 'OFFLINE' } }),
          prisma.onu.count({ where: { oltId: olt.id, portNumber: port.portNumber, status: 'LOS' } }),
        ]);

        return {
          ...port,
          totalOnus: port._count.onus,
          onlineOnus: onlineCount,
          offlineOnus: offlineCount,
          losOnus: losCount,
        };
      })
    );

    return portsWithStats;
  }

  async getRegisteredOnus(oltId, { page = 1, limit = 50, portNumber, search, status, signalQuality } = {}) {
    const id = parseInt(oltId);
    const skip = (page - 1) * limit;

    const where = { oltId: id };
    if (portNumber) where.portNumber = parseInt(portNumber);
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { macAddress: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
        { customer: { pppoeUsername: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (signalQuality === 'CRITICAL') {
      where.OR = [
        { rxPower: { lt: -27.0 } },
        { status: 'LOS' },
      ];
    } else if (signalQuality === 'WARNING') {
      where.rxPower = { gte: -27.0, lt: -24.0 };
    } else if (signalQuality === 'GOOD') {
      where.rxPower = { gte: -24.0 };
    }

    const [onus, total] = await prisma.$transaction([
      prisma.onu.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              pppoeUsername: true,
              status: true,
              package: { select: { name: true, speed: true } },
            },
          },
          ponPortRef: {
            select: { portName: true, txPower: true },
          },
        },
        orderBy: [{ portNumber: 'asc' }, { onuId: 'asc' }],
      }),
      prisma.onu.count({ where }),
    ]);

    // If database has 0 ONUs (e.g. fresh OLT), run initial sync
    if (total === 0 && !search && !portNumber && !status) {
      try {
        await this.syncOlt(id);
        return this.getRegisteredOnus(oltId, { page, limit, portNumber, search, status, signalQuality });
      } catch (_) {}
    }

    return {
      onus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUnregisteredOnus(oltId) {
    const olt = await prisma.olt.findUnique({ where: { id: parseInt(oltId) } });
    if (!olt) throw new Error('OLT not found');
    const driver = OltFactory.getDriver(olt);
    return await driver.getUnregisteredOnus();
  }

  async getOpticalDiagnostics(oltId, onuId) {
    const onu = await prisma.onu.findUnique({
      where: { id: parseInt(onuId) },
      include: { olt: true, customer: true },
    });
    if (!onu) throw new Error('ONU not found');

    const driver = OltFactory.getDriver(onu.olt);
    const diag = await driver.getOnuOpticalDiagnostics(onu.portNumber, onu.onuId);

    // Update DB with latest optical readings
    if (diag.rxPower !== undefined) {
      await prisma.onu.update({
        where: { id: onu.id },
        data: {
          rxPower: diag.rxPower,
          txPower: diag.txPower || onu.txPower,
          status: diag.status === 'CRITICAL' && diag.rxPower < -30 ? 'LOS' : onu.status,
        },
      });

      if (onu.customerId) {
        await prisma.customer.update({
          where: { id: onu.customerId },
          data: { opticalPower: diag.rxPower },
        });
      }
    }

    return {
      ...diag,
      onuName: onu.name,
      customerName: onu.customer?.name || null,
      customerPhone: onu.customer?.phone || null,
    };
  }

  async authorizeOnu(oltId, data, userId) {
    const id = parseInt(oltId);
    const olt = await prisma.olt.findUnique({
      where: { id },
      include: { ponPorts: true },
    });
    if (!olt) throw new Error('OLT not found');

    const driver = OltFactory.getDriver(olt);
    const driverResult = await driver.authorizeOnu(data);

    const portNumber = parseInt(data.portNumber);
    const onuId = parseInt(data.onuId) || 1;
    const ponPort = olt.ponPorts.find((p) => p.portNumber === portNumber);
    const customerId = data.customerId ? parseInt(data.customerId) : null;

    const savedOnu = await prisma.onu.upsert({
      where: {
        oltId_portNumber_onuId: {
          oltId: id,
          portNumber,
          onuId,
        },
      },
      update: {
        macAddress: data.macAddress || null,
        serialNumber: data.serialNumber || null,
        name: data.name || undefined,
        model: data.model || undefined,
        vlanId: parseInt(data.vlanId) || 100,
        vlanMode: data.vlanMode || 'TAG',
        customerId,
        isAuthorized: true,
        status: 'ONLINE',
        rxPower: -20.5,
      },
      create: {
        oltId: id,
        ponPortId: ponPort ? ponPort.id : null,
        portNumber,
        onuId,
        macAddress: data.macAddress || null,
        serialNumber: data.serialNumber || null,
        name: data.name || `Customer-${portNumber}:${onuId}`,
        model: data.model || 'XPON ONU',
        vendor: olt.brand,
        vlanId: parseInt(data.vlanId) || 100,
        vlanMode: data.vlanMode || 'TAG',
        customerId,
        isAuthorized: true,
        status: 'ONLINE',
        rxPower: -20.5,
      },
    });

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          oltId: id,
          opticalPower: -20.5,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTHORIZE_ONU',
        details: JSON.stringify({
          oltId: id,
          portNumber,
          onuId,
          mac: data.macAddress,
          serial: data.serialNumber,
          customerId,
        }),
      },
    });

    return {
      success: true,
      message: driverResult.message || 'ONU authorized successfully',
      onu: savedOnu,
    };
  }

  async unauthorizeOnu(oltId, onuId, userId) {
    const onu = await prisma.onu.findUnique({
      where: { id: parseInt(onuId) },
      include: { olt: true },
    });
    if (!onu) throw new Error('ONU not found');

    const driver = OltFactory.getDriver(onu.olt);
    await driver.unauthorizeOnu(onu.portNumber, onu.onuId, onu.macAddress || onu.serialNumber);

    if (onu.customerId) {
      await prisma.customer.update({
        where: { id: onu.customerId },
        data: { oltId: null, opticalPower: null },
      });
    }

    await prisma.onu.delete({ where: { id: onu.id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UNAUTHORIZE_ONU',
        details: JSON.stringify({
          oltId: onu.oltId,
          portNumber: onu.portNumber,
          onuId: onu.onuId,
          mac: onu.macAddress,
        }),
      },
    });

    return { success: true, message: `ONU on Port ${onu.portNumber}:${onu.onuId} unbinded and deleted` };
  }

  async rebootOnu(oltId, onuId, userId) {
    const onu = await prisma.onu.findUnique({
      where: { id: parseInt(onuId) },
      include: { olt: true },
    });
    if (!onu) throw new Error('ONU not found');

    const driver = OltFactory.getDriver(onu.olt);
    const result = await driver.rebootOnu(onu.portNumber, onu.onuId);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REBOOT_ONU',
        details: JSON.stringify({ oltId: onu.oltId, portNumber: onu.portNumber, onuId: onu.onuId }),
      },
    });

    return result;
  }

  async toggleOnuPort(oltId, onuId, disable, userId) {
    const onu = await prisma.onu.findUnique({
      where: { id: parseInt(onuId) },
      include: { olt: true },
    });
    if (!onu) throw new Error('ONU not found');

    const driver = OltFactory.getDriver(onu.olt);
    const result = await driver.toggleOnuPort(onu.portNumber, onu.onuId, disable);

    await prisma.onu.update({
      where: { id: onu.id },
      data: {
        status: disable ? 'OFFLINE' : 'ONLINE',
        lastDeregisterReason: disable ? 'Admin Disabled (Port Cutoff)' : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: disable ? 'DISABLE_ONU_PORT' : 'ENABLE_ONU_PORT',
        details: JSON.stringify({ oltId: onu.oltId, onuId: onu.id }),
      },
    });

    return result;
  }

  async executeRawCli(oltId, command, userId) {
    const olt = await prisma.olt.findUnique({ where: { id: parseInt(oltId) } });
    if (!olt) throw new Error('OLT not found');

    const driver = OltFactory.getDriver(olt);
    const output = await driver.executeRawCli(command);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXECUTE_OLT_CLI',
        details: JSON.stringify({ oltId: olt.id, command }),
      },
    });

    return { command, output };
  }

  async getOpticalSummary() {
    const [totalOlts, onlineOlts] = await Promise.all([
      prisma.olt.count({ where: { isActive: true } }),
      prisma.olt.count({ where: { isActive: true, status: 'ONLINE' } }),
    ]);

    const [totalOnus, onlineOnus, offlineOnus, losOnus] = await Promise.all([
      prisma.onu.count(),
      prisma.onu.count({ where: { status: 'ONLINE' } }),
      prisma.onu.count({ where: { status: 'OFFLINE' } }),
      prisma.onu.count({ where: { status: 'LOS' } }),
    ]);

    const [optimalSignal, marginalSignal, criticalSignal] = await Promise.all([
      prisma.onu.count({ where: { rxPower: { gte: -24.0 } } }),
      prisma.onu.count({ where: { rxPower: { gte: -27.0, lt: -24.0 } } }),
      prisma.onu.count({ where: { OR: [{ rxPower: { lt: -27.0 } }, { status: 'LOS' }] } }),
    ]);

    // Fetch high-risk customers with weak signal
    const criticalOnus = await prisma.onu.findMany({
      where: {
        OR: [{ rxPower: { lt: -27.0 } }, { status: 'LOS' }],
      },
      take: 10,
      include: {
        olt: { select: { name: true, brand: true } },
        customer: { select: { id: true, name: true, phone: true, area: true } },
      },
      orderBy: { rxPower: 'asc' },
    });

    return {
      totalOlts,
      onlineOlts,
      totalOnus,
      onlineOnus,
      offlineOnus,
      losOnus,
      opticalDistribution: {
        optimal: optimalSignal,
        marginal: marginalSignal,
        critical: criticalSignal,
      },
      criticalOnus,
    };
  }
}

module.exports = new OltService();

