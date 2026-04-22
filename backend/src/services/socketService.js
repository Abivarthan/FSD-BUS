const { Server } = require('socket.io');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to real-time tracking:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

const emitLocationUpdate = (gpsData) => {
  if (io) {
    io.emit('vehicleLocation', gpsData);
  }
};

module.exports = { init, emitLocationUpdate };
