const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/packages - List all packages
router.get('/', packageController.getAll);

// GET /api/packages/:id - Get package by ID
router.get('/:id', packageController.getById);

// POST /api/packages - Create new package (ADMIN, MANAGER only)
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), packageController.create);

// PUT /api/packages/:id - Update package (ADMIN, MANAGER only)
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), packageController.update);

// DELETE /api/packages/:id - Delete package (ADMIN only)
router.delete('/:id', roleMiddleware('ADMIN'), packageController.delete);

module.exports = router;