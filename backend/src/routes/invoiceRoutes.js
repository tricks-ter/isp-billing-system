const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', invoiceController.getAll);
router.get('/summary', invoiceController.getMonthlySummary);
router.get('/:id', invoiceController.getById);
router.post('/generate', roleMiddleware('ADMIN', 'MANAGER'), invoiceController.generate);

module.exports = router;