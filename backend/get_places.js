const mongoose = require('mongoose');
const Route = require('./src/models/Route');
require('dotenv').config();

const getPlaces = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_management';
    await mongoose.connect(mongoURI);
    
    const routes = await Route.find({});
    const origins = [...new Set(routes.map(r => r.origin))];
    const destinations = [...new Set(routes.map(r => r.destination))];
    
    console.log('Found Origins:', origins);
    console.log('Found Destinations:', destinations);
    
    process.exit(0);
  } catch (err) {
    console.error('Error fetching places:', err);
    process.exit(1);
  }
};

getPlaces();
