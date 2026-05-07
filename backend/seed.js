require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Route = require('./src/models/Route');
const Booking = require('./src/models/Booking');
const Vehicle = require('./src/models/Vehicle');
const DriverProfile = require('./src/models/DriverProfile');
const VehicleAssignment = require('./src/models/VehicleAssignment');

const MONGODB_URI = process.env.MONGODB_URI.replace('mongodb:27017', 'localhost:27017');

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // 1. Clear existing demo data
    await User.deleteMany({ email: { $in: ['admin@busms.com', 'customer@example.com', 'driver@busms.com'] } });
    await Route.deleteMany({});
    await Vehicle.deleteMany({});
    await DriverProfile.deleteMany({});
    await Booking.deleteMany({});
    await VehicleAssignment.deleteMany({});
    
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@busms.com',
      password: hashedPassword,
      role: 'admin'
    });

    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@example.com',
      password: hashedPassword,
      role: 'customer'
    });

    const driverUser = await User.create({
      name: 'Rajesh Kumar',
      email: 'driver@busms.com',
      password: hashedPassword,
      role: 'driver'
    });

    const driverProfile = await DriverProfile.create({
      user_id: driverUser._id,
      phone: '+91 98765 43210',
      license_number: 'DL-0420110012345',
      status: 'active'
    });

    console.log('Creating routes and vehicles...');
    
    // Route 1: Bangalore
    const route1 = await Route.create({
      name: 'Bangalore Urban Express',
      origin: 'Majestic',
      destination: 'Electronic City',
      stops: ['Silk Board', 'HSR Layout', 'Koramangala'],
      schedule: [{ day: 'Daily', time: '09:30 AM' }, { day: 'Daily', time: '05:30 PM' }],
      price: 45,
      vehicle_type: 'Bus'
    });

    const v1 = await Vehicle.create({
      vehicle_type: 'bus',
      registration_number: 'KA-01-BK-9999',
      model: 'Volvo 9400 B11R',
      capacity: 45,
      fuel_type: 'diesel',
      status: 'active'
    });

    // Route 2: Mumbai
    const route2 = await Route.create({
      name: 'Mumbai Marine Drive Special',
      origin: 'CST',
      destination: 'Bandra',
      stops: ['Marine Drive', 'Worli', 'Dadar'],
      schedule: [{ day: 'Daily', time: '08:00 AM' }, { day: 'Daily', time: '07:00 PM' }],
      price: 60,
      vehicle_type: 'Luxury'
    });

    const v2 = await Vehicle.create({
      vehicle_type: 'bus',
      registration_number: 'MH-01-XY-1234',
      model: 'Scania Metrolink',
      capacity: 50,
      fuel_type: 'diesel',
      status: 'active'
    });

    // Route 3: Delhi
    const route3 = await Route.create({
      name: 'Delhi Heritage Tour',
      origin: 'Red Fort',
      destination: 'Qutub Minar',
      stops: ['India Gate', 'Cannaught Place', 'Lajpat Nagar'],
      schedule: [{ day: 'Daily', time: '10:00 AM' }, { day: 'Daily', time: '02:00 PM' }],
      price: 35,
      vehicle_type: 'Mini-Bus'
    });

    const v3 = await Vehicle.create({
      vehicle_type: 'bus',
      registration_number: 'DL-01-HT-5678',
      model: 'Force Traveller',
      capacity: 15,
      fuel_type: 'diesel',
      status: 'active'
    });

    await VehicleAssignment.create({
      vehicle_id: v1._id,
      driver_id: driverProfile._id,
      start_date: new Date(),
      is_active: true
    });

    console.log('Creating demo booking...');
    await Booking.create({
      user: customer._id,
      route: route1._id,
      booking_date: new Date(),
      departure_time: '09:30 AM',
      seat_number: 'A1',
      price: 45,
      status: 'Confirmed'
    });

    console.log('Seeding completed successfully!');
    console.log('---------------------------');
    console.log('Customer: customer@example.com | password123');
    console.log('Admin:    admin@busms.com    | password123');
    console.log('---------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
