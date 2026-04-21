const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/geofenceController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, ctrl.getGeofences);
router.post('/', auth, ctrl.createGeofence);
router.put('/:id', auth, ctrl.updateGeofence);
router.delete('/:id', auth, ctrl.deleteGeofence);

module.exports = router;
