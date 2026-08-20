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
        packageId: data.packageId,
        routerId: data.routerId || null,
        joinDate: new Date(),
      },
      include: {
        package: true,
        router: true,
      },
    });

    // If router is assigned, create PPPoE secret on MikroTik
    if (data.routerId) {
      const router = await prisma.router.findUnique({
        where: { id: data.routerId },
      });

      if (router) {
        try {
          await mikrotikService.addPppoeSecret(
            router,
            pppoeUsername,
            pppoePassword,
            data.package.name // Use package name as profile
          );
        } catch (error) {
          // Log error but don't fail customer creation
          console.error('Failed to create PPPoE secret on router:', error);
        }
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CUSTOMER',
        details: JSON.stringify({ customerId: customer.id, name: customer.name }),
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

    // Update customer in database
    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        area: data.area,
        packageId: data.packageId,
        routerId: data.routerId || null,
      },
      include: {
        package: true,
        router: true,
      },
    });

    // If package changed and router is assigned, update PPPoE profile
    if (data.packageId !== customer.packageId && customer.routerId) {
      const router = await prisma.router.findUnique({
        where: { id: customer.routerId },
      });

      if (router) {
        try {
          // Remove old secret and add new one with updated profile
          await mikrotikService.removePppoeSecret(router, customer.pppoeUsername);
          await mikrotikService.addPppoeSecret(
            router,
            customer.pppoeUsername,
            customer.pppoePassword,
            updatedCustomer.package.name
          );
        } catch (error) {
          console.error('Failed to update PPPoE secret on router:', error);
        }
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CUSTOMER',
        details: JSON.stringify({ customerId: updatedCustomer.id, changes: data }),
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
        // Don't fail the operation, just log the error
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