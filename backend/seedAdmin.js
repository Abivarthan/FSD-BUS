const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_management';
    await mongoose.connect(mongoURI);

    const existingAdmin = await User.findOne({ email: 'admin@fleetms.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const admin = new User({
        name: 'System Admin',
        email: 'admin@fleetms.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created successfully.');
    } else {
      console.log('✅ Admin user already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin user:', err);
    process.exit(1);
  }
};

seedAdmin();
