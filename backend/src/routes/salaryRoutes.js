const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const salary = require('../controllers/salaryController');

router.get('/monthly', auth, role('admin'), salary.getMonthly);

module.exports = router;
