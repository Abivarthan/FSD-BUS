const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  booking_date: { type: Date, required: true },
  departure_time: { type: String, required: true },
  seat_number: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], default: 'Confirmed' },
  price: { type: Number, required: true },
  payment_status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' },
  payment_method: { type: String, default: 'Credit Card' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Booking', bookingSchema);
