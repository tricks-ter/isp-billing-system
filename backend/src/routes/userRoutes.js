const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.get('/', roleMiddleware('ADMIN'), userController.getAll);
router.post('/', roleMiddleware('ADMIN'), userController.create);
router.put('/:id', roleMiddleware('ADMIN'), userController.update);
router.delete('/:id', roleMiddleware('ADMIN'), userController.delete);
router.post('/change-password', userController.changePassword);
router.put('/profile/me', userController.updateProfile);

module.exports = router;