const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const DriverProfile = require('../models/DriverProfile');

exports.getAll = async (req, res, next) => {
  try {
    const { driver_id, vehicle_id, date, month, year, page = 1, limit = 30 } = req.query;
    let query = {};

    if (driver_id) query.driver_id = driver_id;
    if (vehicle_id) query.vehicle_id = vehicle_id;

    if (date) query.date = new Date(date);
    if (month && year) {
      const start = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(query)
      .populate({ path: 'driver_id', populate: { path: 'user_id', select: 'name' } })
      .populate('vehicle_id', 'registration_number')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    const data = records.map(r => ({
      ...r.toObject(),
      attendance_id: r._id,
      driver_name: r.driver_id?.user_id?.name || null,
      registration_number: r.vehicle_id?.registration_number || null,
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

    const { driver_id, vehicle_id, date, status, check_in_time, check_out_time, notes } = req.body;

    const recordDate = new Date(date);
    const vId = vehicle_id || undefined;

    const record = await Attendance.findOneAndUpdate(
      { driver_id, date: recordDate },
      { driver_id, vehicle_id: vId, date: recordDate, status, check_in_time, check_out_time, notes },
      { new: true, upsert: true }
    );


    res.status(201).json({ success: true, message: 'Attendance recorded', data: { id: record._id } });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const { driver_id, month, year } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    const start = new Date(`${y}-${m.toString().padStart(2, '0')}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const matchStage = { date: { $gte: start, $lt: end } };
    if (driver_id) {
      matchStage.driver_id = new require('mongoose').Types.ObjectId(driver_id);
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$driver_id',
          total_days: { $sum: 1 },
          present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent_days: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          leave_days: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
        }
      },
      {
        $project: {
          driver_id: '$_id',
          _id: 0,
          total_days: 1,
          present_days: 1,
          absent_days: 1,
          leave_days: 1,
          attendance_rate: {
            $round: [{ $multiply: [{ $divide: ['$present_days', '$total_days'] }, 100] }, 1]
          }
        }
      }
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
