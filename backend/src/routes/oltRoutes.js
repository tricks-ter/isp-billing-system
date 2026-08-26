// backend/src/routes/oltRoutes.js
const express = require('express');
const router = express.Router();
const oltController = require('../controllers/oltController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Global optical summary
router.get('/optical-summary', (req, res) => oltController.getOpticalSummary(req, res));

// OLT CRUD & Management
router.get('/', (req, res) => oltController.getAllOlts(req, res));
router.get('/:id', (req, res) => oltController.getOltById(req, res));
router.post('/', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.createOlt(req, res));
router.put('/:id', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.updateOlt(req, res));
router.delete('/:id', roleMiddleware('ADMIN'), (req, res) => oltController.deleteOlt(req, res));

// Testing & Synchronization
router.post('/:id/test', (req, res) => oltController.testConnection(req, res));
router.post('/:id/sync', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.syncOlt(req, res));

// PON Ports & ONUs
router.get('/:id/pon-ports', (req, res) => oltController.getPonPorts(req, res));
router.get('/:id/onus', (req, res) => oltController.getRegisteredOnus(req, res));
router.get('/:id/unregistered', (req, res) => oltController.getUnregisteredOnus(req, res));

// ONU Provisioning & Diagnostics
router.post('/:id/authorize-onu', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.authorizeOnu(req, res));
router.delete('/:id/onus/:onuId', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.unauthorizeOnu(req, res));
router.post('/:id/onus/:onuId/reboot', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.rebootOnu(req, res));
router.post('/:id/onus/:onuId/toggle-port', roleMiddleware('ADMIN', 'MANAGER'), (req, res) => oltController.toggleOnuPort(req, res));
router.get('/:id/onus/:onuId/diagnostics', (req, res) => oltController.getOpticalDiagnostics(req, res));

// Web CLI Execution
router.post('/:id/cli', roleMiddleware('ADMIN'), (req, res) => oltController.executeRawCli(req, res));

module.exports = router;

