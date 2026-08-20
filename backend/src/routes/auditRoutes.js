const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', roleMiddleware('ADMIN', 'MANAGER'), auditController.getLogs);
router.get('/stats', roleMiddleware('ADMIN', 'MANAGER'), auditController.getStats);

module.exports = router;