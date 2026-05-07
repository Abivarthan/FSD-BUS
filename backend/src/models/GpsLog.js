const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  status: { type: String } // e.g., 'moving', 'idle', 'stopped'
});

// Indexing for faster retrieval
gpsLogSchema.index({ vehicle_id: 1, timestamp: -1 });
gpsLogSchema.index({ trip_id: 1, timestamp: 1 });

module.exports = mongoose.model('GpsLog', gpsLogSchema);
