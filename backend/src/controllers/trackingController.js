const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const GpsLog = require('../models/GpsLog');
const gpsService = require('../services/gpsTrackingService');
const axios = require('axios');

/**
 * Fetch route path using OSRM API
 */
const fetchRoutePath = async (start, end) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await axios.get(url);
    if (response.data.routes && response.data.routes.length > 0) {
      return response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
    return [[start.lat, start.lng], [end.lat, end.lng]];
  } catch (error) {
    console.error('OSRM API Error:', error.message);
    return [[start.lat, start.lng], [end.lat, end.lng]];
  }
};

exports.getAllLiveLocations = async (req, res, next) => {
  try {
    const locations = await gpsService.getLivePositions();
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
};

exports.startEnhancedSimulation = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;
    const { start_location, end_location } = req.body;

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    let trip = await Trip.findOne({ vehicle_id, status: 'ongoing' });
    
    if (!trip) {
      const start = start_location || { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 };
      const end = end_location || { name: 'Madurai Junction', lat: 9.9252, lng: 78.1198 };
      
      trip = new Trip({
        vehicle_id,
        start_location: start,
        end_location: end,
        status: 'ongoing',
        actual_start_time: new Date()
      });
      await trip.save();
    }

    if (!trip.route_path || trip.route_path.length < 2) {
      trip.route_path = await fetchRoutePath(trip.start_location, trip.end_location);
      await trip.save();
    }

    await gpsService.startSimulatingTrip(trip._id);
    
    res.json({ 
      success: true, 
      data: { trip_id: trip._id, vehicle_id, route_length: trip.route_path.length }
    });
  } catch (err) {
    next(err);
  }
};

exports.getTripPlayback = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId).populate('vehicle_id');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const history = await GpsLog.find({ trip_id: tripId }).sort({ timestamp: 1 });
    
    res.json({ 
      success: true, 
      data: { trip, history: history.length > 0 ? history : trip.route_path.map(p => ({ latitude: p[0], longitude: p[1], timestamp: new Date() })) } 
    });
  } catch (err) {
    next(err);
  }
};

exports.getOptimizationReports = async (req, res, next) => {
  try {
    const vehiclesData = await Vehicle.find();
    const reports = await Promise.all(vehiclesData.map(async (v) => {
      const logs = await GpsLog.find({ vehicle_id: v._id });
      const totalDistance = logs.length * 0.5;
      const idleLogs = logs.filter(l => l.speed === 0);

      return {
        vehicle_id: v._id,
        registration_number: v.registration_number,
        total_distance: totalDistance.toFixed(2),
        fuel_efficiency: (totalDistance / (10 + Math.random() * 5)).toFixed(1),
        idle_time: idleLogs.length * 3 / 60, // minutes
        status: v.status,
        route_deviation: Math.random() > 0.8 ? 'Detected' : 'None'
      };
    }));

    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};
