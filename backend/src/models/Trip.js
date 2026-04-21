const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
  start_location: {
    name: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  end_location: {
    name: { type: String },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  actual_start_time: { type: Date },
  actual_end_time: { type: Date },
  route_path: { type: mongoose.Schema.Types.Mixed }, // Array of [lat, lng] or GeoJSON
  distance_km: { type: Number, default: 0 },
  average_speed: { type: Number, default: 0 },
  idle_time_mins: { type: Number, default: 0 },
  route_deviation: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Trip', tripSchema);
