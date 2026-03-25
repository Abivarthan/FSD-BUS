const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenanceController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../utils/validators');
const { maintenanceBillUpload } = require('../middleware/upload');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, role('admin'), validators.maintenance, ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.get('/overdue', auth, ctrl.getOverdue);
router.post('/:id/upload-bill', auth, role('admin'), maintenanceBillUpload.single('bill'), ctrl.uploadBill);

module.exports = router;
