const mongoose = require('mongoose');
const Vehicle = require('./src/models/Vehicle');
const Trip = require('./src/models/Trip');
const GpsLog = require('./src/models/GpsLog');
const Geofence = require('./src/models/Geofence');
require('dotenv').config();

const seedTrackingData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create a dummy vehicle if none exists
    let vehicle = await Vehicle.findOne();
    if (!vehicle) {
      vehicle = await Vehicle.create({
        vehicle_type: 'bus',
        registration_number: 'TN-01-TRACK-2026',
        model: 'Eicher Skyline',
        capacity: 40,
        fuel_type: 'diesel'
      });
    }

    // 2. Create a Trip
    const trip = await Trip.create({
      vehicle_id: vehicle._id,
      status: 'completed',
      start_location: { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      end_location: { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
      actual_start_time: new Date(Date.now() - 3600000),
      actual_end_time: new Date()
    });

    // 3. Create GPS Logs for playback demo
    const logs = [];
    const points = 20;
    for (let i = 0; i < points; i++) {
      logs.push({
        vehicle_id: vehicle._id,
        trip_id: trip._id,
        latitude: 13.0827 - (i * 0.1),
        longitude: 80.2707 - (i * 0.15),
        speed: 50 + Math.random() * 10,
        timestamp: new Date(Date.now() - (points - i) * 60000)
      });
    }
    await GpsLog.insertMany(logs);

    // 4. Create Geofences
    await Geofence.create([
      {
        name: 'Chennai Depot',
        zone_type: 'depot',
        type: 'polygon',
        coordinates: [[13.08, 80.27], [13.09, 80.27], [13.09, 80.28], [13.08, 80.28], [13.08, 80.27]]
      }
    ]);

    console.log('Seed successful! Trip ID for playback:', trip._id);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedTrackingData();
