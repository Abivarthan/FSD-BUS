const mongoose = require('mongoose');

const vehicleAssignmentSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

vehicleAssignmentSchema.virtual('assignment_id').get(function() {
  return this._id.toHexString();
});
vehicleAssignmentSchema.set('toJSON', { virtuals: true });
vehicleAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);
