const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validators = require('../utils/validators');

router.post('/register', validators.register, authController.register);
router.post('/login', validators.login, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.get('/users', authMiddleware, roleMiddleware('admin'), authController.getUsers);
router.patch('/users/:id/toggle', authMiddleware, roleMiddleware('admin'), authController.toggleUser);

module.exports = router;
