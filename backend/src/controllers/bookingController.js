const Booking = require('../models/Booking');
const Route = require('../models/Route');
const logger = require('../utils/logger');

exports.getBookings = async (req, res, next) => {
  try {
    const filters = {};
    if (req.user.role === 'customer') {
      filters.user = req.user.id;
    }
    const bookings = await Booking.find(filters).populate('user route').sort({ created_at: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user route');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Authorization check
    if (req.user.role === 'customer' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { routeId, bookingDate, seatNumber, departureTime } = req.body;
    
    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const booking = new Booking({
      user: req.user.id,
      route: routeId,
      booking_date: bookingDate,
      departure_time: departureTime,
      seat_number: seatNumber,
      price: route.price,
      status: 'Confirmed'
    });

    await booking.save();
    logger.info(`New booking created by user ${req.user.id} for route ${routeId}`);

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (req.user.role === 'customer' && booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getAllBookingsAdmin = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('user route').sort({ created_at: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};
