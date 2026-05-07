const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const VehicleAssignment = require('../models/VehicleAssignment');
const Vehicle = require('../models/Vehicle');
const logger = require('../utils/logger');

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const drivers = await DriverProfile.find(query)
      .populate('user_id', 'name email is_active')
      .sort({ date_joined: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await DriverProfile.countDocuments(query);

    const activeAssignments = await VehicleAssignment.find({ is_active: true })
      .populate('vehicle_id', 'registration_number model');

    const enrichedDrivers = drivers.map(d => {
      const assignment = activeAssignments.find(a => a.driver_id.toString() === d._id.toString());
      return {
        ...d.toObject(),
        driver_id: d._id,
        name: d.user_id ? d.user_id.name : null,
        email: d.user_id ? d.user_id.email : null,
        is_active: d.user_id ? d.user_id.is_active : null,
        assigned_vehicle: assignment && assignment.vehicle_id ? assignment.vehicle_id.registration_number : null,
        vehicle_model: assignment && assignment.vehicle_id ? assignment.vehicle_id.model : null,
      };
    });

    res.json({ success: true, data: enrichedDrivers, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const driver = await DriverProfile.findById(req.params.id).populate('user_id', 'name email role');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const assignment = await VehicleAssignment.findOne({ driver_id: driver._id, is_active: true })
      .populate('vehicle_id', 'registration_number model');

    const data = {
      ...driver.toObject(),
      driver_id: driver._id,
      name: driver.user_id ? driver.user_id.name : null,
      email: driver.user_id ? driver.user_id.email : null,
      role: driver.user_id ? driver.user_id.role : null,
      assigned_vehicle: assignment && assignment.vehicle_id ? assignment.vehicle_id.registration_number : null,
      vehicle_model: assignment && assignment.vehicle_id ? assignment.vehicle_id.model : null,
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password = 'Driver@123', phone, address, license_number, license_expiry, date_joined } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashedPwd = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPwd, role: 'driver' });
    await user.save();

    const profile = new DriverProfile({
      user_id: user._id, phone, address, license_number, license_expiry, date_joined
    });
    await profile.save();

    logger.info(`Driver created: ${email}`);

    res.status(201).json({
      success: true, message: 'Driver created',
      data: { user_id: user._id, driver_id: profile._id }
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, license_number, license_expiry, status } = req.body;

    const driver = await DriverProfile.findById(id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    if (name) {
      await User.findByIdAndUpdate(driver.user_id, { name });
    }

    Object.assign(driver, { phone, address, license_number, license_expiry, status });
    await driver.save();

    res.json({ success: true, message: 'Driver updated' });
  } catch (err) {
    next(err);
  }
};
