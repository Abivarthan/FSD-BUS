const { validationResult } = require('express-validator');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');

exports.getAll = async (req, res, next) => {
  try {
    const { vehicle_id, status, overdue, page = 1, limit = 20 } = req.query;
    let query = {};

    if (vehicle_id) query.vehicle_id = vehicle_id;
    if (status) query.status = status;
    
    if (overdue === 'true') {
      query.next_service_due = { $lt: new Date() };
    }

    const records = await MaintenanceRecord.find(query)
      .populate('vehicle_id', 'registration_number model')
      .sort({ service_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MaintenanceRecord.countDocuments(query);

    const data = records.map(r => ({
      ...r.toObject(),
      maintenance_id: r._id,
      registration_number: r.vehicle_id ? r.vehicle_id.registration_number : null,
      model: r.vehicle_id ? r.vehicle_id.model : null,
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

    const { vehicle_id, service_date, service_type, cost, notes, next_service_due, odometer_at_service, service_provider, status = 'completed' } = req.body;

    const record = new MaintenanceRecord({
      vehicle_id,
      service_date: new Date(service_date),
      service_type,
      cost,
      notes,
      next_service_due: next_service_due ? new Date(next_service_due) : undefined,
      odometer_at_service,
      service_provider,
      status
    });
    await record.save();

    // Create expense record
    const expense = new Expense({
      vehicle_id,
      category: 'maintenance',
      amount: cost,
      date: new Date(service_date),
      description: `Maintenance: ${service_type}`,
      created_by: req.user.id
    });
    await expense.save();

    // Update vehicle status
    if (status === 'in_progress') {
      await Vehicle.findByIdAndUpdate(vehicle_id, { status: 'maintenance' });
    } else if (status === 'completed') {
      await Vehicle.findByIdAndUpdate(vehicle_id, { status: 'active' });
    }

    res.status(201).json({ success: true, message: 'Maintenance record created', data: { maintenance_id: record._id } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { service_date, service_type, cost, notes, next_service_due, status } = req.body;

    const record = await MaintenanceRecord.findByIdAndUpdate(
      id,
      {
        service_date: service_date ? new Date(service_date) : undefined,
        service_type,
        cost,
        notes,
        next_service_due: next_service_due ? new Date(next_service_due) : undefined,
        status
      },
      { new: true }
    );

    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });

    res.json({ success: true, message: 'Maintenance record updated' });
  } catch (err) {
    next(err);
  }
};

exports.getOverdue = async (req, res, next) => {
  try {
    const today = new Date();
    
    const records = await MaintenanceRecord.aggregate([
      {
        $match: {
          next_service_due: { $lt: today },
          status: { $ne: 'completed' }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicle_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          maintenance_id: '$_id',
          vehicle_id: 1,
          service_date: 1,
          service_type: 1,
          cost: 1,
          notes: 1,
          next_service_due: 1,
          status: 1,
          registration_number: '$vehicle.registration_number',
          model: '$vehicle.model',
          days_overdue: {
            $floor: {
              $divide: [
                { $subtract: [today, '$next_service_due'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $sort: { days_overdue: -1 } }
    ]);

    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { id } = req.params;
    const record = await MaintenanceRecord.findById(id);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });

    record.service_bill_image = `/uploads/service_bills/${req.file.filename}`;
    await record.save();

    res.json({ success: true, message: 'Bill uploaded successfully', path: record.service_bill_image });
  } catch (err) {
    next(err);
  }
};
