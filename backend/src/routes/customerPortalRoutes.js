// backend/src/routes/customerPortalRoutes.js
const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const customerAuthMiddleware = require('../middleware/customerAuthMiddleware');

// Public Customer Auth
router.post('/auth/login', customerPortalController.login);

// Protected Customer Portal Endpoints
router.use(customerAuthMiddleware);

router.get('/dashboard', customerPortalController.getDashboard);
router.get('/invoices', customerPortalController.getInvoices);
router.get('/payments', customerPortalController.getPayments);
router.get('/tickets', customerPortalController.getTickets);
router.post('/tickets', customerPortalController.createTicket);
router.get('/packages', customerPortalController.getPackages);
router.put('/profile', customerPortalController.updateProfile);
router.post('/pay/bkash', customerPortalController.initiateBkashPayment);
router.post('/payments/initiate', customerPortalController.initiateBkashPayment);

module.exports = router;
