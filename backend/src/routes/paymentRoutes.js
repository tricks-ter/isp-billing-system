const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', paymentController.getAll);
router.get('/daily', paymentController.getDailyCollection);
router.post('/', paymentController.record);

module.exports = router;