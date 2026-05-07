const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  service_date: { type: Date, required: true },
  service_type: { type: String, required: true },
  cost: { type: Number, required: true },
  notes: { type: String },
  next_service_due: { type: Date },
  odometer_at_service: { type: Number },
  service_provider: { type: String },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed'], default: 'completed' },
  service_bill_image: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

maintenanceRecordSchema.virtual('maintenance_id').get(function() {
  return this._id.toHexString();
});
maintenanceRecordSchema.set('toJSON', { virtuals: true });
maintenanceRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
