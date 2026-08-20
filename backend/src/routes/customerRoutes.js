const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/customers - List all customers (with pagination and search)
router.get('/', customerController.getAll);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customerController.getById);

// POST /api/customers - Create new customer (ADMIN, MANAGER only)
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), customerController.create);

// PUT /api/customers/:id - Update customer (ADMIN, MANAGER only)
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), customerController.update);

// DELETE /api/customers/:id - Delete customer (ADMIN only)
router.delete('/:id', roleMiddleware('ADMIN'), customerController.delete);

// POST /api/customers/:id/suspend - Suspend customer (ADMIN, MANAGER only)
router.post('/:id/suspend', roleMiddleware('ADMIN', 'MANAGER'), customerController.suspend);

// POST /api/customers/:id/restore - Restore customer (ADMIN, MANAGER only)
router.post('/:id/restore', roleMiddleware('ADMIN', 'MANAGER'), customerController.restore);

module.exports = router;