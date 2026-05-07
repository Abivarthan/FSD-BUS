const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const DriverProfile = require('./src/models/DriverProfile');

const seedDrivers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleet_management';
    await mongoose.connect(mongoURI);

    const driverEmail = 'driver1@fleetms.com';
    const existingDriver = await User.findOne({ email: driverEmail });

    if (!existingDriver) {
      const hashedPassword = await bcrypt.hash('Driver@123', 10);
      const user = new User({
        name: 'John Doe',
        email: driverEmail,
        password: hashedPassword,
        role: 'driver'
      });
      await user.save();

      const profile = new DriverProfile({
        user_id: user._id,
        license_number: 'DL12345678',
        license_expiry: new Date('2028-12-31'),
        status: 'active',
        join_date: new Date()
      });
      await profile.save();

      console.log('✅ Default driver created successfully.');
      console.log(`Email: ${driverEmail}`);
      console.log(`Password: Driver@123`);
    } else {
      console.log('✅ Default driver already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding driver:', err);
    process.exit(1);
  }
};

seedDrivers();
