const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

class AuthService {
  async login(username, password) {
    // 1. Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new Error('Invalid username or password.');
    }

    // 2. Check if user is active
    if (!user.isActive) {
      throw new Error('Account is disabled. Contact administrator.');
    }

    // 3. Verify password (bcrypt comparison)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password.');
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 5. Log the login event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: JSON.stringify({ username: user.username }),
      },
    });

    // 6. Return token and user info (NEVER return the password)
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, fullName: true, role: true, createdAt: true },
    });
    if (!user) throw new Error('User not found.');
    return user;
  }
}

module.exports = new AuthService();