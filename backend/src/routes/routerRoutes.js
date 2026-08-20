// FILE: ./backend/src/routes/routerRoutes.js
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

// NEW ROUTES FOR FULL MIKROTIK MANAGEMENT
router.get('/:id/info', routerController.getRouterInfo);
router.get('/:id/pppoe-secrets', routerController.getPppoeSecrets);
router.post('/:id/pppoe-secrets', roleMiddleware('ADMIN', 'MANAGER'), routerController.createPppoeSecret);
router.put('/:id/pppoe-secrets/:username', roleMiddleware('ADMIN', 'MANAGER'), routerController.updatePppoeSecret);
router.delete('/:id/pppoe-secrets/:username', roleMiddleware('ADMIN', 'MANAGER'), routerController.deletePppoeSecret);
router.get('/:id/active-sessions', routerController.getActiveSessions);
router.get('/:id/profiles', routerController.getProfiles);
router.get('/:id/queues', routerController.getSimpleQueues);

module.exports = router;