const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/routeController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/', ctrl.getRoutes); // Public for customers to search
router.get('/:id', ctrl.getRouteById); // Public
router.post('/', auth, role('admin'), ctrl.createRoute);
router.put('/:id', auth, role('admin'), ctrl.updateRoute);
router.delete('/:id', auth, role('admin'), ctrl.deleteRoute);

module.exports = router;
