const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Route = require('../models/Route');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    // await User.deleteMany({ role: { $ne: 'admin' } });
    // await Route.deleteMany({});

    // Create Sample Routes
    const routes = [
      {
        name: "Metro Express (Central - North)",
        origin: "Central Station",
        destination: "North Valley",
        stops: ["Market Square", "Tech Park"],
        schedule: [
          { day: "Monday", time: "08:00 AM" },
          { day: "Wednesday", time: "09:00 AM" }
        ],
        price: 45,
        vehicle_type: "Luxury"
      },
      {
        name: "Coastal Shuttle",
        origin: "Beach Town",
        destination: "Downtown",
        stops: ["Marina Hub"],
        schedule: [
          { day: "Daily", time: "10:30 AM" },
          { day: "Daily", time: "05:00 PM" }
        ],
        price: 25,
        vehicle_type: "Bus"
      }
    ];

    await Route.insertMany(routes);
    console.log('Sample routes seeded');

    // Create a customer user
    const hashedPW = await bcrypt.hash('Customer@123', 10);
    const customer = new User({
        name: 'John Customer',
        email: 'customer@busms.com',
        password: hashedPW,
        role: 'customer'
    });
    
    await customer.save().catch(e => console.log('Customer already exists'));
    console.log('Sample customer created: customer@busms.com / Customer@123');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
