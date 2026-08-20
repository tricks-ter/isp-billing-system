const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route
router.post('/login', authController.login);

// Protected route (requires valid JWT)
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;