const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fuelController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../utils/validators');
const { fuelBillUpload } = require('../middleware/upload');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, validators.fuel, ctrl.create);
router.get('/summary', auth, ctrl.getSummary);
router.post('/:id/upload-bill', auth, role('admin'), fuelBillUpload.single('bill'), ctrl.uploadBill);

module.exports = router;
