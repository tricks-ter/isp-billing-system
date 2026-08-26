const userService = require('../services/userService');

class UserController {
  async getAll(req, res) {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const user = await userService.createUser(req.body, req.user?.id || 1);
      return res.status(201).json({ success: true, data: user, message: 'User created successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user?.id || 1);
      return res.status(200).json({ success: true, data: user, message: 'User updated successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, message: result.message || 'User deleted successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user?.id || 1, currentPassword, newPassword);
      return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await userService.updateProfile(req.user?.id || 1, req.body);
      return res.status(200).json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();