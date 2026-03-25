const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trackingController');
const auth = require('../middleware/authMiddleware');

router.post('/:bookingId/start', auth, ctrl.startTracking);
router.get('/:bookingId/location', auth, ctrl.getLocation);
router.get('/:bookingId/details', auth, ctrl.getBookingTrackingDetails);

module.exports = router;
