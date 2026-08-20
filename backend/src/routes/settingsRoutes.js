// FILE: ./backend/src/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Get MikroTik mock mode status
router.get('/mikrotik-mock-mode', settingsController.getMikrotikMockMode);

// Set MikroTik mock mode (ADMIN only)
router.put('/mikrotik-mock-mode', roleMiddleware('ADMIN'), settingsController.setMikrotikMockMode);

// Get SMS mock mode status
router.get('/sms-mock-mode', settingsController.getSmsMockMode);

// Set SMS mock mode (ADMIN only)
router.put('/sms-mock-mode', roleMiddleware('ADMIN'), settingsController.setSmsMockMode);

// Get all settings (ADMIN only)
router.get('/', roleMiddleware('ADMIN'), settingsController.getAllSettings);

module.exports = router;