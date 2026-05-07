const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const reports = require('../controllers/reportController');

router.get('/fuel', auth, role('admin'), reports.getFuelReport);
router.get('/attendance', auth, role('admin'), reports.getAttendanceReport);
router.get('/expenses', auth, role('admin'), reports.getExpenseReport);
router.get('/vehicle-monthly', auth, role('admin'), reports.getVehicleMonthly);
router.get('/vehicle-monthly/pdf', auth, role('admin'), reports.exportVehicleMonthlyPDF);
router.get('/vehicle-monthly/excel', auth, role('admin'), reports.exportVehicleMonthlyExcel);

module.exports = router;
