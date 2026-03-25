const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
  date: { type: Date, required: true },
  fuel_quantity_liters: { type: Number, required: true },
  fuel_cost: { type: Number, required: true },
  odometer_reading: { type: Number },
  fuel_station: { type: String },
  notes: { type: String },
  fuel_bill_image: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

fuelLogSchema.virtual('fuel_id').get(function() {
  return this._id.toHexString();
});
fuelLogSchema.set('toJSON', { virtuals: true });
fuelLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FuelLog', fuelLogSchema);
