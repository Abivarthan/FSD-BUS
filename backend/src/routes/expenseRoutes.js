const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const validators = require('../utils/validators');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, role('admin'), validators.expense, ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);
router.get('/summary', auth, ctrl.getSummary);

module.exports = router;
