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
    const routerId = parseInt(id);
    const router = await prisma.router.findUnique({
      where: { id: routerId },
    });
    if (!router) throw new Error('Router not found');

    await prisma.$transaction(async (tx) => {
      // Unlink customers assigned to this router
      await tx.customer.updateMany({
        where: { routerId },
        data: { routerId: null },
      });

      // Delete the router
      await tx.router.delete({
        where: { id: routerId },
      });
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'DELETE_ROUTER',
          details: JSON.stringify({ routerId: router.id, name: router.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return { success: true };
  }

  async testConnection(id) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
    });
    if (!router) throw new Error('Router not found');
    return await mikrotikService.testConnection(router);
  }

  async getLiveStatus() {
    const customers = await prisma.customer.findMany({
      include: {
        package: true,
        router: true,
      },
      orderBy: { name: 'asc' },
    });

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

    // REAL IMPLEMENTATION - with timeout protection
    const routers = await prisma.router.findMany({ where: { isActive: true } });
    const allActiveSessions = [];

    // Fetch sessions concurrently with timeout
    const sessionPromises = routers.map(async (router) => {
      try {
        const sessions = await Promise.race([
          mikrotikService.getActiveSessions(router),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        return sessions;
      } catch (error) {
        console.error(`Failed to fetch sessions from ${router.name}:`, error.message);
        return [];
      }
    });

    const sessionsResults = await Promise.all(sessionPromises);
    sessionsResults.forEach(sessions => allActiveSessions.push(...sessions));

    const customersWithStatus = customers.map(c => {
      const session = allActiveSessions.find(s => s.username === c.pppoeUsername);
      return {
        ...c,
        routerName: c.router?.name || 'No Router',
        routerIp: c.router?.ipAddress || '-',
        isOnline: !!session,
        uptime: session?.uptime || '-',
        ipAddress: session?.address || '-',
        bytesIn: session?.bytesIn || 0,
        bytesOut: session?.bytesOut || 0,
      };
    });

    return {
      total: customersWithStatus.length,
      online: customersWithStatus.filter(c => c.isOnline).length,
      offline: customersWithStatus.filter(c => !c.isOnline).length,
      customers: customersWithStatus,
    };
  }

  async getRouterInfo(id) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(id) },
    });
    if (!router) throw new Error('Router not found');
    return await mikrotikService.getRouterInfo(router);
  }

  async getPppoeSecretsPaginated(routerId, page, limit, search, status) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getPppoeSecretsPaginated(router, page, limit, search, status);
  }

  async createPppoeSecret(routerId, username, password, profile, comment) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(routerId) },
    });
    if (!router) throw new Error('Router not found');
    return await mikrotikService.addPppoeSecret(router, username, password, profile, comment);
  }

  async updatePppoeSecret(routerId, username, newPassword, newProfile) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(routerId) },
    });
    if (!router) throw new Error('Router not found');
    return await mikrotikService.updatePppoeSecret(router, username, newPassword, newProfile);
  }

  async deletePppoeSecret(routerId, username) {
    const router = await prisma.router.findUnique({
      where: { id: parseInt(routerId) },
    });
    if (!router) throw new Error('Router not found');
    return await mikrotikService.removePppoeSecret(router, username);
  }

  async togglePppoeSecret(routerId, username, disable) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.togglePppoeSecret(router, username, disable);
  }

  async getActiveSessionsPaginated(routerId, page, limit, search) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getActiveSessionsPaginated(router, page, limit, search);
  }

  async removeActiveSession(routerId, username) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.removeActiveSession(router, username);
  }

  async getProfilesPaginated(routerId, page, limit, search) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getProfilesPaginated(router, page, limit, search);
  }

  async getSimpleQueuesPaginated(routerId, page, limit, search) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getSimpleQueuesPaginated(router, page, limit, search);
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
          mikrotikService.disablePppoeSecret(customer.router, customer.pppoeUsername)
            .catch(error => console.error(`Failed to disable on router for customer ${id}:`, error));
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
          mikrotikService.enablePppoeSecret(customer.router, customer.pppoeUsername)
            .catch(error => console.error(`Failed to enable on router for customer ${id}:`, error));
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

  // Legacy non-paginated methods
  async getPppoeSecrets(routerId) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getPppoeSecrets(router);
  }

  async getActiveSessions(routerId) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getActiveSessions(router);
  }

  async getProfiles(routerId) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getProfiles(router);
  }

  async getSimpleQueues(routerId) {
    const router = await prisma.router.findUnique({ where: { id: parseInt(routerId) } });
    if (!router) throw new Error('Router not found');
    return mikrotikService.getSimpleQueues(router);
  }
}

module.exports = new RouterService();