const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicleController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../utils/validators');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('admin'), validators.vehicle, ctrl.create);
router.put('/:id', auth, role('admin'), validators.vehicle, ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);
router.post('/assign', auth, role('admin'), ctrl.assign);
router.delete('/:id/unassign', auth, role('admin'), ctrl.unassign);

module.exports = router;
