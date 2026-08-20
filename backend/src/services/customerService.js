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

    // Handle routerId: convert empty string to null
    const routerId = data.routerId ? parseInt(data.routerId) : null;

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
        joinDate: new Date(),
      },
      include: {
        package: true,
        router: true,
      },
    });

    // If router is assigned, create PPPoE secret on MikroTik
    if (routerId && customer.router) {
      try {
        await mikrotikService.addPppoeSecret(
          customer.router,
          pppoeUsername,
          pppoePassword,
          customer.package.name
        );
      } catch (error) {
        console.error('Failed to create PPPoE secret on router:', error);
        // Don't fail customer creation, just log the error
      }
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

    // Handle routerId: convert empty string to null
    const newRouterId = data.routerId ? parseInt(data.routerId) : null;

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
      },
      include: {
        package: true,
        router: true,
      },
    });

    // If router changed or package changed, update PPPoE on router
    if (customer.routerId || newRouterId) {
      const oldRouter = customer.router;
      const newRouter = updatedCustomer.router;

      // Remove from old router if it changed
      if (oldRouter && oldRouter.id !== newRouterId) {
        try {
          await mikrotikService.removePppoeSecret(oldRouter, customer.pppoeUsername);
        } catch (error) {
          console.error('Failed to remove from old router:', error);
        }
      }

      // Add to new router
      if (newRouter) {
        try {
          await mikrotikService.addPppoeSecret(
            newRouter,
            customer.pppoeUsername,
            customer.pppoePassword,
            updatedCustomer.package.name
          );
        } catch (error) {
          console.error('Failed to add to new router:', error);
        }
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

    // Remove PPPoE secret from router if assigned
    if (customer.routerId && customer.router) {
      try {
        await mikrotikService.removePppoeSecret(customer.router, customer.pppoeUsername);
      } catch (error) {
        console.error('Failed to remove PPPoE secret from router:', error);
      }
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

    // Disable PPPoE on router if assigned
    if (customer.routerId && customer.router) {
      try {
        await mikrotikService.disablePppoeSecret(customer.router, customer.pppoeUsername);
      } catch (error) {
        console.error('Failed to disable PPPoE on router:', error);
      }
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

    // Enable PPPoE on router if assigned
    if (customer.routerId && customer.router) {
      try {
        await mikrotikService.enablePppoeSecret(customer.router, customer.pppoeUsername);
      } catch (error) {
        console.error('Failed to enable PPPoE on router:', error);
      }
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