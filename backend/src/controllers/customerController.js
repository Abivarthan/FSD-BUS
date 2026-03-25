const User = require('../models/User');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get booking stats
    const totalBookings = await Booking.countDocuments({ user: req.user.id });
    const completedTrips = await Booking.countDocuments({ user: req.user.id, status: 'Completed' });
    const upcomingTrips = await Booking.countDocuments({ user: req.user.id, status: 'Confirmed', booking_date: { $gte: new Date() } });
    const cancelledTrips = await Booking.countDocuments({ user: req.user.id, status: 'Cancelled' });
    const totalSpent = await Booking.aggregate([
      { $match: { user: user._id, status: { $in: ['Confirmed', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          total_bookings: totalBookings,
          completed_trips: completedTrips,
          upcoming_trips: upcomingTrips,
          cancelled_trips: cancelledTrips,
          total_spent: totalSpent[0]?.total || 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`Customer profile updated: ${user._id}`);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.getBookingHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const filters = { user: req.user.id };
    if (status) filters.status = status;

    const bookings = await Booking.find(filters)
      .populate('route')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Booking.countDocuments(filters);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};
