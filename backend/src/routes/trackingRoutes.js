const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trackingController');
const auth = require('../middleware/authMiddleware');

// Live Tracking & Simulation
router.get('/live', auth, ctrl.getAllLiveLocations);
router.post('/update', auth, ctrl.updateLocation);
router.post('/gps/update', auth, ctrl.updateLocation);
router.post('/simulate/:vehicle_id', auth, ctrl.startEnhancedSimulation);
router.post('/start-simulation', auth, ctrl.startEnhancedSimulation);

// Trip Playback
router.get('/playback/:tripId', auth, ctrl.getTripPlayback);

// Analytics & Reports
router.get('/reports/optimization', auth, ctrl.getOptimizationReports);

module.exports = router;
