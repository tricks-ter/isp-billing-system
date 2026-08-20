const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/transactions', financeController.getTransactions);
router.get('/monthly-summary', financeController.getMonthlySummary);
router.post('/income', financeController.addIncome);
router.post('/expense', financeController.addExpense);

module.exports = router;