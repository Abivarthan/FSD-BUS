const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/dashboard', auth, role('admin'), ctrl.getDashboard);
router.get('/fuel-cost', auth, role('admin'), ctrl.getFuelAnalytics);
router.get('/expenses', auth, role('admin'), ctrl.getExpenseAnalytics);
router.get('/attendance', auth, role('admin'), ctrl.getAttendanceAnalytics);

module.exports = router;
