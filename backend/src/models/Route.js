const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Express Central to Suburbs"
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  stops: [{ type: String }],
  schedule: [{ 
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Daily'] },
    time: { type: String } // e.g., "08:30 AM"
  }],
  price: { type: Number, required: true },
  vehicle_type: { type: String, enum: ['Bus', 'Mini-Bus', 'Luxury'], default: 'Bus' },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Route', routeSchema);
