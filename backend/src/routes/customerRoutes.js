const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');
const auth = require('../middleware/authMiddleware');

router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, ctrl.updateProfile);
router.get('/history', auth, ctrl.getBookingHistory);

module.exports = router;
