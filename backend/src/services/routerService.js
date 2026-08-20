// FILE: ./backend/src/services/routerService.js
const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');

class RouterService {
  async getAllRouters() {
    const routers = await prisma.router.findMany({
      include: {
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return routers;
  }

  async getRouterById(id) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
      include: {
        customers: {
          include: { package: true },
        },
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!router) throw new Error('Router not found');
    return router;
  }

  async createRouter(data, userId) {
    const router = await prisma.router.create({
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        apiPort: parseInt(data.apiPort) || 8728,
        username: data.username,
        password: data.password,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ROUTER',
        details: JSON.stringify({ routerId: router.id, name: router.name }),
      },
    });

    return router;
  }

  async updateRouter(id, data, userId) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
    });

    if (!router) throw new Error('Router not found');

    const updatedRouter = await prisma.router.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        apiPort: parseInt(data.apiPort) || 8728,
        username: data.username,
        password: data.password,
        isActive: data.isActive !== undefined ? data.isActive : router.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_ROUTER',
        details: JSON.stringify({ routerId: updatedRouter.id, changes: data }),
      },
    });

    return updatedRouter;
  }

  async deleteRouter(id, userId) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { customers: true } },
      },
    });

    if (!router) throw new Error('Router not found');

    if (router._count.customers > 0) {
      throw new Error('Cannot delete router with assigned customers. Reassign customers first.');
    }

    await prisma.router.delete({ where: { id: parseInt(id) } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_ROUTER',
        details: JSON.stringify({ routerId: router.id, name: router.name }),
      },
    });

    return { success: true };
  }

  async testConnection(id) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
    });

    if (!router) throw new Error('Router not found');

    try {
      // BUG FIX: Changed from mikrotikService.connect(router) to connectToRouter(router)
      const api = await mikrotikService.connectToRouter(router);
      
      // In mock mode, connectToRouter returns { mock: true, router }
      if (api.mock) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        return {
          success: true,
          message: 'Connection successful (Mock Mode)',
          mock: true,
          routerInfo: {
            identity: `${router.name} (Mock)`,
            version: '7.15 (Mock)',
            uptime: '2 days, 14 hours',
          },
        };
      }

      // Real connection test
      const identity = await api.write('/system/identity/print');
      const resource = await api.write('/system/resource/print');
      
      mikrotikService.disconnect(api);

      return {
        success: true,
        message: 'Connection successful',
        routerInfo: {
          identity: identity[0]?.name || 'Unknown',
          version: resource[0]?.version || 'Unknown',
          uptime: resource[0]?.uptime || 'Unknown',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  async getLiveStatus() {
    // Get all customers with their router info
    const customers = await prisma.customer.findMany({
      include: {
        package: true,
        router: true,
      },
      orderBy: { name: 'asc' },
    });

    // In mock mode, simulate online/offline status
    if (mikrotikService.getMockMode()) {
      const customersWithStatus = customers.map(customer => ({
        ...customer,
        routerName: customer.router?.name || 'No Router',
        routerIp: customer.router?.ipAddress || '-',
        isOnline: customer.routerId ? (Math.random() > 0.2) : false,
        uptime: customer.routerId && Math.random() > 0.2 
          ? `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m` 
          : '-',
        ipAddress: customer.routerId 
          ? `192.168.88.${Math.floor(Math.random() * 254) + 1}` 
          : '-',
      }));

      return {
        total: customersWithStatus.length,
        online: customersWithStatus.filter(c => c.isOnline).length,
        offline: customersWithStatus.filter(c => !c.isOnline).length,
        customers: customersWithStatus,
      };
    }

    // BUG FIX: REAL IMPLEMENTATION - Actually query MikroTik for active PPPoE sessions
    const routers = await prisma.router.findMany({ where: { isActive: true } });
    const activeSessions = [];
    
    for (const router of routers) {
      try {
        const sessions = await mikrotikService.getRouterActiveSessions(router);
        activeSessions.push(...sessions);
      } catch (error) {
        console.error(`[LiveStatus] Failed to fetch sessions from ${router.name}:`, error.message);
      }
    }

    // Map customers with their real online status based on PPPoE username
    const customersWithStatus = customers.map(c => {
      const session = activeSessions.find(s => s.username === c.pppoeUsername);
      return {
        ...c,
        routerName: c.router?.name || 'No Router',
        routerIp: c.router?.ipAddress || '-',
        isOnline: !!session,
        uptime: session?.uptime || '-',
        ipAddress: session?.address || '-',
      };
    });

    return {
      total: customersWithStatus.length,
      online: customersWithStatus.filter(c => c.isOnline).length,
      offline: customersWithStatus.filter(c => !c.isOnline).length,
      customers: customersWithStatus,
    };
  }

  async bulkSuspend(customerIds, userId) {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of customerIds) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: parseInt(id) },
          include: { router: true },
        });

        if (!customer) {
          results.failed++;
          results.errors.push({ id, error: 'Customer not found' });
          continue;
        }

        if (customer.status === 'SUSPENDED') {
          results.failed++;
          results.errors.push({ id, error: 'Already suspended' });
          continue;
        }

        await prisma.customer.update({
          where: { id: parseInt(id) },
          data: { status: 'SUSPENDED' },
        });

        if (customer.routerId && customer.router) {
          try {
            await mikrotikService.disablePppoeSecret(customer.router, customer.pppoeUsername);
          } catch (error) {
            console.error(`Failed to disable on router for customer ${id}:`, error);
          }
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_SUSPEND',
        details: JSON.stringify({ customerIds, results }),
      },
    });

    return results;
  }

  async bulkRestore(customerIds, userId) {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of customerIds) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: parseInt(id) },
          include: { router: true },
        });

        if (!customer) {
          results.failed++;
          results.errors.push({ id, error: 'Customer not found' });
          continue;
        }

        if (customer.status === 'ACTIVE') {
          results.failed++;
          results.errors.push({ id, error: 'Already active' });
          continue;
        }

        await prisma.customer.update({
          where: { id: parseInt(id) },
          data: { status: 'ACTIVE' },
        });

        if (customer.routerId && customer.router) {
          try {
            await mikrotikService.enablePppoeSecret(customer.router, customer.pppoeUsername);
          } catch (error) {
            console.error(`Failed to enable on router for customer ${id}:`, error);
          }
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ id, error: error.message });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_RESTORE',
        details: JSON.stringify({ customerIds, results }),
      },
    });

    return results;
  }
}

module.exports = new RouterService();