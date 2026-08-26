const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');
const { v4: uuidv4 } = require('uuid');

class CustomerService {
  async getAllCustomers(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { pppoeUsername: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          package: true,
          router: true,
          olt: { select: { id: true, name: true, brand: true } },
          onu: { select: { id: true, portNumber: true, onuId: true, macAddress: true, serialNumber: true, status: true, rxPower: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async createCustomer(data, userId) {
    // Generate PPPoE credentials if not provided
    const pppoeUsername = data.pppoeUsername || `pppoe_${uuidv4().slice(0, 8)}`;
    const pppoePassword = data.pppoePassword || uuidv4().slice(0, 12);

    // Handle routerId & oltId: convert empty string to null
    const routerId = data.routerId ? parseInt(data.routerId) : null;
    const oltId = data.oltId ? parseInt(data.oltId) : null;

    // Create customer in database
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        area: data.area,
        pppoeUsername,
        pppoePassword,
        status: 'ACTIVE',
        packageId: parseInt(data.packageId),
        routerId: routerId,
        oltId: oltId,
        fiberSplitter: data.fiberSplitter || null,
        fiberCore: data.fiberCore || null,
        joinDate: new Date(),
      },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
      },
    });

    // If router is assigned, initiate PPPoE secret creation (NON-BLOCKING)
    if (routerId && customer.router) {
      // Fire and forget - don't await
      mikrotikService.addPppoeSecret(
        customer.router,
        pppoeUsername,
        pppoePassword,
        customer.package.name
      ).catch(error => {
        console.error('Failed to create PPPoE secret on router:', error.message);
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CUSTOMER',
        details: JSON.stringify({
          customerId: customer.id,
          name: customer.name,
          routerId: routerId
        }),
      },
    });

    return customer;
  }

  async updateCustomer(id, data, userId) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { package: true, router: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Handle routerId & oltId: convert empty string to null
    const newRouterId = data.routerId ? parseInt(data.routerId) : null;
    const newOltId = data.oltId ? parseInt(data.oltId) : null;

    // Update customer in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        area: data.area,
        packageId: parseInt(data.packageId),
        routerId: newRouterId,
        oltId: newOltId,
        fiberSplitter: data.fiberSplitter !== undefined ? data.fiberSplitter : undefined,
        fiberCore: data.fiberCore !== undefined ? data.fiberCore : undefined,
      },
      include: {
        package: true,
        router: true,
        olt: true,
        onu: true,
      },
    });

    // If router changed or package changed, update PPPoE on router (NON-BLOCKING)
    if (customer.routerId || newRouterId) {
      const oldRouter = customer.router;
      const newRouter = updatedCustomer.router;

      // Remove from old router if it changed
      if (oldRouter && oldRouter.id !== newRouterId) {
        mikrotikService.removePppoeSecret(oldRouter, customer.pppoeUsername)
          .catch(error => console.error('Failed to remove from old router:', error.message));
      }

      // Add to new router
      if (newRouter) {
        mikrotikService.addPppoeSecret(
          newRouter,
          customer.pppoeUsername,
          customer.pppoePassword,
          updatedCustomer.package.name
        ).catch(error => console.error('Failed to add to new router:', error.message));
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CUSTOMER',
        details: JSON.stringify({
          customerId: updatedCustomer.id,
          changes: data,
          routerChanged: customer.routerId !== newRouterId
        }),
      },
    });

    return updatedCustomer;
  }

  async deleteCustomer(id, userId) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { router: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Remove PPPoE secret from router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.removePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to remove PPPoE secret from router:', error.message));
    }

    // Delete customer from database
    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_CUSTOMER',
        details: JSON.stringify({ customerId: customer.id, name: customer.name }),
      },
    });

    return { success: true };
  }

  async suspendCustomer(id, userId) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { router: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    if (customer.status === 'SUSPENDED') {
      throw new Error('Customer is already suspended');
    }

    // Update status in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { status: 'SUSPENDED' },
    });

    // Disable PPPoE on router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.disablePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to disable PPPoE on router:', error.message));
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SUSPEND_CUSTOMER',
        details: JSON.stringify({ customerId: customer.id, name: customer.name }),
      },
    });

    return updatedCustomer;
  }

  async restoreCustomer(id, userId) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { router: true },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
    if (customer.status === 'ACTIVE') {
      throw new Error('Customer is already active');
    }

    // Update status in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' },
    });

    // Enable PPPoE on router if assigned (NON-BLOCKING)
    if (customer.routerId && customer.router) {
      mikrotikService.enablePppoeSecret(customer.router, customer.pppoeUsername)
        .catch(error => console.error('Failed to enable PPPoE on router:', error.message));
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RESTORE_CUSTOMER',
        details: JSON.stringify({ customerId: customer.id, name: customer.name }),
      },
    });

    return updatedCustomer;
  }
}

module.exports = new CustomerService();