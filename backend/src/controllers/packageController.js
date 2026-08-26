const packageService = require('../services/packageService');

class PackageController {
  async getAll(req, res) {
    try {
      const packages = await packageService.getAllPackages();
      return res.status(200).json({ success: true, data: packages });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const pkg = await packageService.getPackageById(req.params.id);
      return res.status(200).json({ success: true, data: pkg });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const pkg = await packageService.createPackage(req.body, req.user?.id || 1);
      return res.status(201).json({ success: true, data: pkg, message: 'Package created successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const pkg = await packageService.updatePackage(req.params.id, req.body, req.user?.id || 1);
      return res.status(200).json({ success: true, data: pkg, message: 'Package updated successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await packageService.deletePackage(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, message: result.message || 'Package deleted successfully' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PackageController();