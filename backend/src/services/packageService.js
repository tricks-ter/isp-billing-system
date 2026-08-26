const prisma = require('../config/db');

class PackageService {
  async getAllPackages() {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return packages;
  }

  async getPackageById(id) {
    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    return pkg;
  }

  async createPackage(data, userId) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Package name is required');
    }
    if (!data.speed || data.speed.trim() === '') {
      throw new Error('Speed is required');
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      throw new Error('Price must be a valid positive number');
    }

    const validity = parseInt(data.validity) || 30;
    if (isNaN(validity) || validity < 1) {
      throw new Error('Validity must be at least 1 day');
    }

    // Check for duplicate package name
    const existing = await prisma.package.findFirst({
      where: { name: { equals: data.name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      throw new Error(`A package with the name "${data.name.trim()}" already exists`);
    }

    const pkg = await prisma.package.create({
      data: {
        name: data.name.trim(),
        speed: data.speed.trim(),
        price,
        validity,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'CREATE_PACKAGE',
          details: JSON.stringify({ packageId: pkg.id, name: pkg.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return pkg;
  }

  async updatePackage(id, data, userId) {
    const packageId = parseInt(id);
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    if (data.name && data.name.trim() !== pkg.name) {
      const existing = await prisma.package.findFirst({
        where: {
          name: { equals: data.name.trim(), mode: 'insensitive' },
          id: { not: packageId },
        },
      });
      if (existing) {
        throw new Error(`A package with the name "${data.name.trim()}" already exists`);
      }
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.speed) updateData.speed = data.speed.trim();
    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0) throw new Error('Price must be a valid positive number');
      updateData.price = price;
    }
    if (data.validity !== undefined) {
      const validity = parseInt(data.validity);
      if (isNaN(validity) || validity < 1) throw new Error('Validity must be at least 1 day');
      updateData.validity = validity;
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: updateData,
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'UPDATE_PACKAGE',
          details: JSON.stringify({ packageId: updatedPackage.id, changes: data }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return updatedPackage;
  }

  async deletePackage(id, userId) {
    const packageId = parseInt(id);
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    if (pkg._count.customers > 0) {
      throw new Error(`Cannot delete package "${pkg.name}": ${pkg._count.customers} customers are actively subscribed to it. Please reassign those customers first.`);
    }

    await prisma.package.delete({
      where: { id: packageId },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 1,
          action: 'DELETE_PACKAGE',
          details: JSON.stringify({ packageId: pkg.id, name: pkg.name }),
        },
      });
    } catch (e) {
      console.warn('Audit log write error:', e.message);
    }

    return { success: true, message: `Package "${pkg.name}" deleted successfully` };
  }
}

module.exports = new PackageService();