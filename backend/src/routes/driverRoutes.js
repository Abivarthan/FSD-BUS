const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driverController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('admin'), ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);

module.exports = router;
