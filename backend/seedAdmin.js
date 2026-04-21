const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_management';
    await mongoose.connect(mongoURI);
    console.log('📡 Connected to MongoDB for seeding...');

    // Admin User
    const existingAdmin = await User.findOne({ email: 'admin@fleetms.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = new User({
        name: 'System Admin',
        email: 'admin@fleetms.com',
        password: hashedPassword,
        role: 'admin',
        is_active: true
      });
      await admin.save();
      console.log('✅ Admin user created: admin@fleetms.com / Admin@123');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // Customer User
    const existingCustomer = await User.findOne({ email: 'customer@fleetms.com' });
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash('Customer@123', 10);
      const customer = new User({
        name: 'Sample Customer',
        email: 'customer@fleetms.com',
        password: hashedPassword,
        role: 'customer',
        is_active: true
      });
      await customer.save();
      console.log('✅ Customer user created: customer@fleetms.com / Customer@123');
    } else {
      console.log('ℹ️ Customer user already exists.');
    }

    console.log('✨ Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers();
