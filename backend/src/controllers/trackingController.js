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
    { lat: 13.19855, lng: 77.706599 },
    { lat: 13.198539, lng: 77.707103 },
    { lat: 13.198537, lng: 77.70719 },
    { lat: 13.198507, lng: 77.707497 },
    { lat: 13.198482, lng: 77.707756 },
    { lat: 13.198442, lng: 77.708179 },
    { lat: 13.198426, lng: 77.709123 },
    { lat: 13.198477, lng: 77.709618 },
    { lat: 13.198538, lng: 77.710204 },
    { lat: 13.198556, lng: 77.710523 },
    { lat: 13.198555, lng: 77.710628 },
    { lat: 13.198824, lng: 77.711616 },
    { lat: 13.197706, lng: 77.711604 },
    { lat: 13.196481, lng: 77.710991 },
    { lat: 13.196495, lng: 77.708284 },
    { lat: 13.197298, lng: 77.70555 },
    { lat: 13.198015, lng: 77.699022 },
    { lat: 13.198111, lng: 77.685928 },
    { lat: 13.19806, lng: 77.674433 },
    { lat: 13.198118, lng: 77.668854 },
    { lat: 13.199493, lng: 77.662062 },
    { lat: 13.199301, lng: 77.658841 },
    { lat: 13.196394, lng: 77.654321 },
    { lat: 13.188374, lng: 77.644431 },
    { lat: 13.179485, lng: 77.638054 },
    { lat: 13.170464, lng: 77.632444 },
    { lat: 13.159638, lng: 77.625688 },
    { lat: 13.151843, lng: 77.620355 },
    { lat: 13.144822, lng: 77.617618 },
    { lat: 13.142551, lng: 77.617463 },
    { lat: 13.137871, lng: 77.617595 },
    { lat: 13.127945, lng: 77.613724 },
    { lat: 13.117938, lng: 77.608863 },
    { lat: 13.113145, lng: 77.60596 },
    { lat: 13.105808, lng: 77.601513 },
    { lat: 13.102951, lng: 77.60028 },
    { lat: 13.098861, lng: 77.599187 },
    { lat: 13.09398, lng: 77.597408 },
    { lat: 13.087523, lng: 77.595452 },
    { lat: 13.08316, lng: 77.593671 },
    { lat: 13.079839, lng: 77.593152 },
    { lat: 13.075094, lng: 77.59273 },
    { lat: 13.070251, lng: 77.592945 },
    { lat: 13.065037, lng: 77.593325 },
    { lat: 13.060586, lng: 77.593511 },
    { lat: 13.057904, lng: 77.593495 },
    { lat: 13.053199, lng: 77.593612 },
    { lat: 13.045314, lng: 77.591288 },
    { lat: 13.04057, lng: 77.589717 },
    { lat: 13.036688, lng: 77.58929 },
    { lat: 13.034778, lng: 77.588618 },
    { lat: 13.031453, lng: 77.587396 },
    { lat: 13.028622, lng: 77.586235 },
    { lat: 13.025153, lng: 77.585173 },
    { lat: 13.000388, lng: 77.584197 },
    { lat: 12.998746, lng: 77.584274 },
    { lat: 12.991385, lng: 77.58561 },
    { lat: 12.987748, lng: 77.587614 },
    { lat: 12.983847, lng: 77.591384 },
    { lat: 12.984141, lng: 77.593066 },
    { lat: 12.982576, lng: 77.597152 },
    { lat: 12.978397, lng: 77.598585 },
    { lat: 12.975817, lng: 77.599722 },
    { lat: 12.972769, lng: 77.599139 },
    { lat: 12.972041, lng: 77.598523 },
    { lat: 12.971139, lng: 77.596902 },
    { lat: 12.971585, lng: 77.595378 },
    { lat: 12.971848, lng: 77.594697 }
  ]
};

const activeTracking = new Map();

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
