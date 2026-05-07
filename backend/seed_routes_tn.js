const mongoose = require('mongoose');
const Route = require('./src/models/Route');
require('dotenv').config();

const seedRoutes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing routes for demo
    // await Route.deleteMany({});

    const routes = [
      {
        name: 'Chennai to Madurai Express',
        origin: 'Chennai',
        destination: 'Madurai',
        schedule: [{ day: 'Daily', time: '09:00 PM' }],
        price: 850,
        vehicle_type: 'Luxury',
        is_active: true
      },
      {
        name: 'Coimbatore to Chennai Sleeper',
        origin: 'Coimbatore',
        destination: 'Chennai',
        schedule: [{ day: 'Daily', time: '10:00 PM' }],
        price: 750,
        vehicle_type: 'Bus',
        is_active: true
      },
      {
        name: 'Salem to Trichy Shuttle',
        origin: 'Salem',
        destination: 'Tiruchirappalli',
        schedule: [{ day: 'Daily', time: '06:00 AM' }],
        price: 350,
        vehicle_type: 'Mini-Bus',
        is_active: true
      }
    ];

    for (const r of routes) {
      await Route.findOneAndUpdate(
        { origin: r.origin, destination: r.destination },
        r,
        { upsert: true, new: true }
      );
    }

    console.log('Routes seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedRoutes();
