const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_type: { type: String, enum: ['bus', 'car', 'van', 'truck'], required: true },
  registration_number: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  capacity: { type: Number, required: true },
  fuel_type: { type: String, enum: ['diesel', 'petrol', 'electric', 'hybrid'], required: true },
  purchase_date: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

vehicleSchema.virtual('vehicle_id').get(function() {
  return this._id.toHexString();
});
vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
