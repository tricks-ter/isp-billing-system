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
router.put('/:id/due-date', roleMiddleware('ADMIN', 'MANAGER'), invoiceController.updateDueDate);
router.put('/batch/due-date', roleMiddleware('ADMIN', 'MANAGER'), invoiceController.batchUpdateDueDate);

module.exports = router;