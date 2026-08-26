// FILE: ./backend/src/routes/bkashRoutes.js
const express = require('express');
const router = express.Router();
const bkashController = require('../controllers/bkashController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public Endpoints (Accessible by customer self-service payment flow)
router.get('/public-invoice/:token', bkashController.getPublicInvoice);
router.post('/create', bkashController.createPayment);
router.get('/callback', bkashController.handleCallback);
router.post('/callback', bkashController.handleCallback);

// Authenticated Endpoints (Accessible by ISP staff & admin)
router.post(
  '/generate-link/:invoiceId',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'BILLING', 'STAFF'),
  bkashController.generateQuickPayLink
);

router.get(
  '/query/:paymentId',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'BILLING'),
  bkashController.queryPayment
);

module.exports = router;

