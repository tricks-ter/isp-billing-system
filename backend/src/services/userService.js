const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

class UserService {
  async getAllUsers() {
    return await prisma.user.findMany({
      include: { staff: true, _count: { select: { auditLogs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data, createdBy) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new Error('Username already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role || 'STAFF',
        isActive: true,
      },
    });

    if (data.phone || data.address || data.salary) {
      await prisma.staff.create({
        data: {
          userId: user.id,
          phone: data.phone,
          address: data.address,
          salary: data.salary ? parseFloat(data.salary) : null,
        },
      });
    }

    await prisma.auditLog.create({
      data: { userId: createdBy, action: 'CREATE_USER', details: JSON.stringify({ userId: user.id, username: user.username, role: user.role }) },
    });

    return user;
  }

  async updateUser(id, data, updatedBy) {
    const updateData = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({ where: { id: parseInt(id) }, data: updateData });

    if (data.phone !== undefined || data.address !== undefined || data.salary !== undefined) {
      await prisma.staff.upsert({
        where: { userId: user.id },
        update: { phone: data.phone, address: data.address, salary: data.salary ? parseFloat(data.salary) : null },
        create: { userId: user.id, phone: data.phone, address: data.address, salary: data.salary ? parseFloat(data.salary) : null },
      });
    }

    await prisma.auditLog.create({
      data: { userId: updatedBy, action: 'UPDATE_USER', details: JSON.stringify({ userId: user.id, changes: Object.keys(updateData) }) },
    });

    return user;
  }

  async deleteUser(id, deletedBy) {
    if (id === deletedBy) throw new Error('Cannot delete your own account');
    await prisma.user.delete({ where: { id: parseInt(id) } });

    await prisma.auditLog.create({
      data: { userId: deletedBy, action: 'DELETE_USER', details: JSON.stringify({ userId: id }) },
    });

    return { success: true };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');

    await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(newPassword, 10) } });

    await prisma.auditLog.create({
      data: { userId, action: 'CHANGE_PASSWORD', details: JSON.stringify({ userId }) },
    });

    return { success: true };
  }

  async updateProfile(userId, data) {
    const updateData = {};
    if (data.fullName) updateData.fullName = data.fullName;

    const user = await prisma.user.update({ where: { id: userId }, data: updateData });

    if (data.phone !== undefined || data.address !== undefined) {
      await prisma.staff.upsert({
        where: { userId },
        update: { phone: data.phone, address: data.address },
        create: { userId, phone: data.phone, address: data.address },
      });
    }

    return user;
  }
}

module.exports = new UserService();