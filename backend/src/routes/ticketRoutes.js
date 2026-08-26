// backend/src/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/stats', ticketController.getStats);
router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getById);
router.put('/:id', ticketController.update);
router.delete('/:id', ticketController.delete);

module.exports = router;
