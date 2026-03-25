const { validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const VehicleAssignment = require('../models/VehicleAssignment');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const logger = require('../utils/logger');

exports.getAll = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.vehicle_type = type;

    const vehicles = await Vehicle.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(query);

    // Get active assignments
    const activeAssignments = await VehicleAssignment.find({ is_active: true })
      .populate({
        path: 'driver_id',
        populate: { path: 'user_id', select: 'name' }
      });

    const enrichedVehicles = vehicles.map(v => {
      const assignment = activeAssignments.find(a => a.vehicle_id.toString() === v._id.toString());
      return {
        ...v.toObject(),
        vehicle_id: v._id,
        assigned_driver_id: assignment ? assignment.driver_id._id : null,
        assigned_driver_name: assignment && assignment.driver_id.user_id ? assignment.driver_id.user_id.name : null,
        assignment_id: assignment ? assignment._id : null,
      };
    });

    res.json({ success: true, data: enrichedVehicles, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const assignment = await VehicleAssignment.findOne({ vehicle_id: vehicle._id, is_active: true })
      .populate({
        path: 'driver_id',
        populate: { path: 'user_id', select: 'name' }
      });

    const data = {
      ...vehicle.toObject(),
      vehicle_id: vehicle._id,
      assigned_driver_name: assignment && assignment.driver_id.user_id ? assignment.driver_id.user_id.name : null,
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

    const { vehicle_type, registration_number, model, capacity, fuel_type, purchase_date, status = 'active' } = req.body;

    const vehicle = new Vehicle({
      vehicle_type, registration_number, model, capacity, fuel_type, purchase_date, status
    });
    await vehicle.save();

    logger.info(`Vehicle created: ${registration_number} by user ${req.user.id}`);
    res.status(201).json({ success: true, message: 'Vehicle created', data: { vehicle_id: vehicle._id, ...req.body } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicle_type, registration_number, model, capacity, fuel_type, purchase_date, status } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    Object.assign(vehicle, { vehicle_type, registration_number, model, capacity, fuel_type, purchase_date, status });
    await vehicle.save();

    logger.info(`Vehicle updated: ${id}`);
    res.json({ success: true, message: 'Vehicle updated' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Vehicle.findByIdAndUpdate(id, { status: 'inactive' });
    logger.info(`Vehicle deactivated: ${id}`);
    res.json({ success: true, message: 'Vehicle deactivated' });
  } catch (err) {
    next(err);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, start_date } = req.body;

    // Deactivate existing assignment for vehicle
    await VehicleAssignment.updateMany(
      { vehicle_id, is_active: true },
      { is_active: false, end_date: new Date() }
    );

    // Deactivate existing assignment for driver
    await VehicleAssignment.updateMany(
      { driver_id, is_active: true },
      { is_active: false, end_date: new Date() }
    );

    const assignment = new VehicleAssignment({
      vehicle_id,
      driver_id,
      start_date: start_date || new Date(),
      is_active: true
    });
    await assignment.save();

    res.status(201).json({ success: true, message: 'Vehicle assigned', data: { assignment_id: assignment._id } });
  } catch (err) {
    next(err);
  }
};

exports.unassign = async (req, res, next) => {
  try {
    const { id } = req.params; // Expects vehicle_id
    await VehicleAssignment.updateMany(
      { vehicle_id: id, is_active: true },
      { is_active: false, end_date: new Date() }
    );
    res.json({ success: true, message: 'Vehicle unassigned' });
  } catch (err) {
    next(err);
  }
};
