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
    const pkg = await prisma.package.create({
      data: {
        name: data.name,
        speed: data.speed,
        price: parseFloat(data.price),
        validity: parseInt(data.validity),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_PACKAGE',
        details: JSON.stringify({ packageId: pkg.id, name: pkg.name }),
      },
    });

    return pkg;
  }

  async updatePackage(id, data, userId) {
    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pkg) {
      throw new Error('Package not found');
    }

    const updatedPackage = await prisma.package.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        speed: data.speed,
        price: parseFloat(data.price),
        validity: parseInt(data.validity),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_PACKAGE',
        details: JSON.stringify({ packageId: updatedPackage.id, changes: data }),
      },
    });

    return updatedPackage;
  }

  async deletePackage(id, userId) {
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

    if (pkg._count.customers > 0) {
      throw new Error('Cannot delete package with active customers. Reassign customers first.');
    }

    await prisma.package.delete({
      where: { id: parseInt(id) },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_PACKAGE',
        details: JSON.stringify({ packageId: pkg.id, name: pkg.name }),
      },
    });

    return { success: true };
  }
}

module.exports = new PackageService();