const { validationResult } = require('express-validator');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const DriverProfile = require('../models/DriverProfile');
const mongoose = require('mongoose');

exports.getAll = async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, start_date, end_date, page = 1, limit = 20 } = req.query;
    let query = {};

    if (vehicle_id) query.vehicle_id = vehicle_id;
    if (driver_id) query.driver_id = driver_id;

    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }

    const logs = await FuelLog.find(query)
      .populate('vehicle_id', 'registration_number model')
      .populate({ path: 'driver_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ date: -1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FuelLog.countDocuments(query);

    const data = logs.map(l => ({
      ...l.toObject(),
      fuel_id: l._id,
      registration_number: l.vehicle_id ? l.vehicle_id.registration_number : null,
      model: l.vehicle_id ? l.vehicle_id.model : null,
      driver_name: l.driver_id && l.driver_id.user_id ? l.driver_id.user_id.name : null,
    }));

    res.json({ success: true, data, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    let { vehicle_id, driver_id, date, fuel_quantity_liters, fuel_cost, odometer_reading, fuel_station, notes } = req.body;

    if (req.user.role === 'driver') {
      const profile = await DriverProfile.findOne({ user_id: req.user.id });
      if (profile) driver_id = profile._id;
    }

    const fuelLog = new FuelLog({
      vehicle_id,
      driver_id: driver_id || undefined,
      date: new Date(date),
      fuel_quantity_liters,
      fuel_cost,
      odometer_reading,
      fuel_station,
      notes
    });
    await fuelLog.save();

    // Create corresponding expense
    const expense = new Expense({
      vehicle_id,
      category: 'fuel',
      amount: fuel_cost,
      date: new Date(date),
      description: `Fuel: ${fuel_quantity_liters}L`,
      created_by: req.user.id
    });
    await expense.save();

    res.status(201).json({ success: true, message: 'Fuel log created', data: { fuel_id: fuelLog._id } });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const { vehicle_id, month, year } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    const start = new Date(`${y}-${m.toString().padStart(2, '0')}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const matchStage = { date: { $gte: start, $lt: end } };
    if (vehicle_id) {
      matchStage.vehicle_id = new require('mongoose').Types.ObjectId(vehicle_id);
    }

    const summary = await FuelLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vehicle_id',
          fill_count: { $sum: 1 },
          total_liters: { $sum: '$fuel_quantity_liters' },
          total_cost: { $sum: '$fuel_cost' },
          min_odometer: { $min: '$odometer_reading' },
          max_odometer: { $max: '$odometer_reading' }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicle_id: '$_id',
          registration_number: '$vehicle.registration_number',
          model: '$vehicle.model',
          fill_count: 1,
          total_liters: 1,
          total_cost: 1,
          avg_cost_per_liter: {
            $round: [{ $divide: ['$total_cost', '$total_liters'] }, 2]
          },
          km_driven: {
            $subtract: [
              { $ifNull: ['$max_odometer', 0] },
              { $ifNull: ['$min_odometer', 0] }
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { id } = req.params;
    const fuelLog = await FuelLog.findById(id);
    if (!fuelLog) return res.status(404).json({ success: false, message: 'Fuel log not found' });

    fuelLog.fuel_bill_image = `/uploads/fuel_bills/${req.file.filename}`;
    await fuelLog.save();

    res.json({ success: true, message: 'Bill uploaded successfully', path: fuelLog.fuel_bill_image });
  } catch (err) {
    next(err);
  }
};
