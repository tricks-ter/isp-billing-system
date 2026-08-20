const express = require('express');
const router = express.Router();
const routerController = require('../controllers/routerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', routerController.getAll);
router.get('/live-status', routerController.getLiveStatus);
router.get('/:id', routerController.getById);
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), routerController.create);
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), routerController.update);
router.delete('/:id', roleMiddleware('ADMIN'), routerController.delete);
router.post('/:id/test', routerController.testConnection);
router.post('/bulk/suspend', roleMiddleware('ADMIN', 'MANAGER'), routerController.bulkSuspend);
router.post('/bulk/restore', roleMiddleware('ADMIN', 'MANAGER'), routerController.bulkRestore);

module.exports = router;