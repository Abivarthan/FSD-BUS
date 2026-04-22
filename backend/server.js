require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');
const fs = require('fs');
const connectDB = require('./src/config/database');

connectDB();

// Ensure logs directory exists
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const PORT = process.env.PORT || 5000;

const http = require('http');
const socketService = require('./src/services/socketService');

const httpServer = http.createServer(app);
socketService.init(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`🚀 Fleet Management API with WebSockets running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  httpServer.close(() => process.exit(1));
});
