const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');
const validators = require('../utils/validators');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, validators.attendance, ctrl.create);
router.get('/stats', auth, ctrl.getStats);

module.exports = router;
