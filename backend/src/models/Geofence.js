const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['polygon', 'circle'], default: 'polygon' },
  coordinates: { type: mongoose.Schema.Types.Mixed, required: true }, // For polygon: [[lat, lng], ...], for circle: {lat, lng, radius}
  zone_type: { type: String, enum: ['depot', 'city', 'restricted', 'route_corridor'], required: true },
  description: { type: String },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Geofence', geofenceSchema);
