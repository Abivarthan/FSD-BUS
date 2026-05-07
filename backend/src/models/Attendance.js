const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'leave', 'holiday'], default: 'present' },
  check_in_time: { type: String },
  check_out_time: { type: String },
  notes: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Enforce unique driver & date
attendanceSchema.index({ driver_id: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('attendance_id').get(function() {
  return this._id.toHexString();
});
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
