const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/', auth, ctrl.getBookings); // Filters by User for customers
router.get('/:id', auth, ctrl.getBookingById);
router.post('/', auth, ctrl.createBooking); // Both can create, middleware check in ctrl
router.put('/:id/cancel', auth, ctrl.cancelBooking);
router.get('/admin/all', auth, role('admin'), ctrl.getAllBookingsAdmin);

module.exports = router;
