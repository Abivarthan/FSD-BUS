const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  license_number: { type: String, sparse: true },
  license_expiry: { type: Date },
  date_joined: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  daily_salary: { type: Number, default: 0 }
});

driverProfileSchema.virtual('driver_id').get(function() {
  return this._id.toHexString();
});
driverProfileSchema.set('toJSON', { virtuals: true });
driverProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);
