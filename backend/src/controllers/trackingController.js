const Booking = require('../models/Booking');
const Route = require('../models/Route');
const VehicleAssignment = require('../models/VehicleAssignment');
const logger = require('../utils/logger');

// Simulated GPS coordinates for demo purposes
// In production, this would come from actual GPS devices on vehicles
// --- SIMULATION SETTINGS ---
// Set to 1.0 for realistic 30-min trip demo
// Set higher (e.g. 10.0) to see fast movement
const SIMULATION_SPEED = 5.0; 
// ----------------------------

const DEMO_ROUTES = {
  default: [
    { lat: 12.9716, lng: 77.5946 }, // Majestic
    { lat: 12.9800, lng: 77.5900 },
    { lat: 12.9900, lng: 77.5850 },
    { lat: 13.0031, lng: 77.5812 }, // Silk Board
    { lat: 13.0100, lng: 77.5750 },
    { lat: 13.0200, lng: 77.5700 },
    { lat: 13.0300, lng: 77.5650 },
    { lat: 13.0450, lng: 77.5610 }, // Electronic City
    { lat: 13.0600, lng: 77.5500 },
    { lat: 13.0827, lng: 77.5380 }, // End Terminal
  ]
};

// ... existing state ...

function simulateVehicleMovement(bookingId) {
  const session = activeTracking.get(bookingId);
  if (!session) return null;

  const points = session.routePoints;
  const currentIndex = session.currentIndex;

  if (currentIndex >= points.length - 1) {
    session.currentIndex = 0; // Loop for demo
  }

  const from = points[session.currentIndex];
  const to = points[Math.min(session.currentIndex + 1, points.length - 1)];

  // UPDATED: Progress based on SIMULATION_SPEED
  // Cycle repeats every (5000 / SIMULATION_SPEED) ms
  const cycleDuration = 5000 / SIMULATION_SPEED;
  const progress = (Date.now() % cycleDuration) / cycleDuration;
  const currentLat = from.lat + (to.lat - from.lat) * progress + (Math.random() - 0.5) * 0.0002;
  const currentLng = from.lng + (to.lng - from.lng) * progress + (Math.random() - 0.5) * 0.0002;

  // Advance index every 5 seconds
  if (progress > 0.95) {
    session.currentIndex = Math.min(session.currentIndex + 1, points.length - 1);
  }

  const speed = 35 + Math.random() * 25; // 35-60 km/h
  const remainingPoints = points.length - session.currentIndex;
  const etaMinutes = Math.round(remainingPoints * 3.5);

  return {
    lat: currentLat,
    lng: currentLng,
    speed: Math.round(speed),
    heading: Math.atan2(to.lng - from.lng, to.lat - from.lat) * 180 / Math.PI,
    eta_minutes: etaMinutes,
    last_updated: new Date().toISOString(),
    status: session.currentIndex >= points.length - 2 ? 'arriving' : 'in_transit',
    progress_percent: Math.round((session.currentIndex / (points.length - 1)) * 100)
  };
}

exports.startTracking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('route')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization: customer can only track their own bookings
    if (req.user.role === 'customer' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Initialize tracking session
    if (!activeTracking.has(req.params.bookingId)) {
      activeTracking.set(req.params.bookingId, {
        routePoints: DEMO_ROUTES.default,
        currentIndex: Math.floor(Math.random() * 5), // Start at random point
        startedAt: new Date()
      });
    }

    logger.info(`Tracking started for booking ${req.params.bookingId}`);
    res.json({ success: true, message: 'Tracking session started' });
  } catch (err) {
    next(err);
  }
};

exports.getLocation = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('route')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Auto-start tracking if not active
    if (!activeTracking.has(req.params.bookingId)) {
      activeTracking.set(req.params.bookingId, {
        routePoints: DEMO_ROUTES.default,
        currentIndex: Math.floor(Math.random() * 5),
        startedAt: new Date()
      });
    }

    const location = simulateVehicleMovement(req.params.bookingId);

    res.json({
      success: true,
      data: {
        location,
        route: {
          name: booking.route.name,
          origin: booking.route.origin,
          destination: booking.route.destination,
          stops: booking.route.stops || [],
          waypoints: DEMO_ROUTES.default // For drawing the route line on map
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookingTrackingDetails = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('route')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Find vehicle assignment for the route
    let vehicleInfo = null;
    let driverInfo = null;

    const assignment = await VehicleAssignment.findOne({ is_active: true })
      .populate('vehicle_id')
      .populate({
        path: 'driver_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .sort({ created_at: -1 });

    if (assignment) {
      if (assignment.vehicle_id) {
        vehicleInfo = {
          id: assignment.vehicle_id._id,
          registration_number: assignment.vehicle_id.registration_number,
          model: assignment.vehicle_id.model,
          vehicle_type: assignment.vehicle_id.vehicle_type,
          capacity: assignment.vehicle_id.capacity,
          fuel_type: assignment.vehicle_id.fuel_type,
          status: assignment.vehicle_id.status
        };
      }
      if (assignment.driver_id) {
        driverInfo = {
          id: assignment.driver_id._id,
          name: assignment.driver_id.user_id?.name || 'Driver',
          email: assignment.driver_id.user_id?.email || '',
          phone: assignment.driver_id.phone || '+91 98765 43210',
          license_number: assignment.driver_id.license_number || 'DL-XXXX-XXXX',
          status: assignment.driver_id.status,
          rating: (4 + Math.random()).toFixed(1), // Simulated rating
          total_trips: Math.floor(200 + Math.random() * 500)
        };
      }
    }

    // Fallback demo data if no assignments found
    if (!vehicleInfo) {
      vehicleInfo = {
        id: 'demo',
        registration_number: 'KA-01-AB-1234',
        model: 'Volvo 9400XL',
        vehicle_type: 'bus',
        capacity: 45,
        fuel_type: 'diesel',
        status: 'active'
      };
    }

    if (!driverInfo) {
      driverInfo = {
        id: 'demo',
        name: 'Rajesh Kumar',
        email: 'rajesh@busms.com',
        phone: '+91 98765 43210',
        license_number: 'DL-0420110012345',
        status: 'active',
        rating: '4.8',
        total_trips: 342
      };
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking._id,
          booking_date: booking.booking_date,
          departure_time: booking.departure_time,
          seat_number: booking.seat_number,
          status: booking.status,
          price: booking.price,
          payment_status: booking.payment_status
        },
        route: {
          id: booking.route._id,
          name: booking.route.name,
          origin: booking.route.origin,
          destination: booking.route.destination,
          stops: booking.route.stops || [],
          vehicle_type: booking.route.vehicle_type
        },
        vehicle: vehicleInfo,
        driver: driverInfo
      }
    });
  } catch (err) {
    next(err);
  }
};
