const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:27017/${process.env.DB_NAME || 'fleet_management'}`;
    const conn = await mongoose.connect(mongoURI);
    logger.info(`✅ MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection failed: ' + error.message);
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
