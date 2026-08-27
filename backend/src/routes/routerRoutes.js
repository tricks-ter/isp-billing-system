// backend/src/routes/routerRoutes.js
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

// --- Router Info ---
router.get('/:id/info', routerController.getRouterInfo);

// --- PPPoE Secrets ---
router.get('/:id/pppoe-secrets', routerController.getPppoeSecrets); // legacy
router.get('/:id/pppoe-secrets/paginated', routerController.getPppoeSecretsPaginated);
router.post('/:id/pppoe-secrets', roleMiddleware('ADMIN', 'MANAGER'), routerController.createPppoeSecret);
router.put('/:id/pppoe-secrets/:username', roleMiddleware('ADMIN', 'MANAGER'), routerController.updatePppoeSecret);
router.delete('/:id/pppoe-secrets/:username', roleMiddleware('ADMIN', 'MANAGER'), routerController.deletePppoeSecret);
router.post('/:id/pppoe-secrets/:username/toggle', roleMiddleware('ADMIN', 'MANAGER'), routerController.togglePppoeSecret);

// --- Active Sessions ---
router.get('/:id/active-sessions', routerController.getActiveSessions); // legacy
router.get('/:id/active-sessions/paginated', routerController.getActiveSessionsPaginated);
router.delete('/:id/active-sessions/:username', roleMiddleware('ADMIN', 'MANAGER'), routerController.removeActiveSession);

// --- Profiles ---
router.get('/:id/profiles', routerController.getProfiles); // legacy
router.get('/:id/profiles/paginated', routerController.getProfilesPaginated);

// --- Queues ---
router.get('/:id/queues', routerController.getSimpleQueues); // legacy
router.get('/:id/queues/paginated', routerController.getSimpleQueuesPaginated);

// --- CLI Terminal ---
router.post('/:id/cli', roleMiddleware('ADMIN', 'MANAGER'), routerController.executeCliCommand);

module.exports = router;