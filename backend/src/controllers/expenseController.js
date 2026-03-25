const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

exports.getAll = async (req, res, next) => {
  try {
    const { vehicle_id, category, start_date, end_date, page = 1, limit = 20 } = req.query;
    let query = {};

    if (vehicle_id) query.vehicle_id = vehicle_id;
    if (category) query.category = category;
    
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }

    const expenses = await Expense.find(query)
      .populate('vehicle_id', 'registration_number')
      .populate('created_by', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    const data = expenses.map(e => ({
      ...e.toObject(),
      expense_id: e._id,
      registration_number: e.vehicle_id ? e.vehicle_id.registration_number : null,
      created_by_name: e.created_by ? e.created_by.name : null,
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

    const { vehicle_id, category, amount, date, description, receipt_number } = req.body;

    const expense = new Expense({
      vehicle_id: vehicle_id || undefined,
      category,
      amount,
      date: new Date(date),
      description,
      receipt_number,
      created_by: req.user.id
    });
    await expense.save();

    res.status(201).json({ success: true, message: 'Expense created', data: { expense_id: expense._id } });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicle_id, category, amount, date, description } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { vehicle_id: vehicle_id || undefined, category, amount, date: new Date(date), description },
      { new: true }
    );

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    res.json({ success: true, message: 'Expense updated' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearInt = parseInt(year);

    const startOfYear = new Date(`${yearInt}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${yearInt + 1}-01-01T00:00:00Z`);

    const matchStage = { $match: { date: { $gte: startOfYear, $lt: endOfYear } } };

    const byCategory = await Expense.aggregate([
      matchStage,
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          _id: 0,
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    const byMonth = await Expense.aggregate([
      matchStage,
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          month: '$_id',
          month_name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 1] }, then: 'January' },
                { case: { $eq: ['$_id', 2] }, then: 'February' },
                { case: { $eq: ['$_id', 3] }, then: 'March' },
                { case: { $eq: ['$_id', 4] }, then: 'April' },
                { case: { $eq: ['$_id', 5] }, then: 'May' },
                { case: { $eq: ['$_id', 6] }, then: 'June' },
                { case: { $eq: ['$_id', 7] }, then: 'July' },
                { case: { $eq: ['$_id', 8] }, then: 'August' },
                { case: { $eq: ['$_id', 9] }, then: 'September' },
                { case: { $eq: ['$_id', 10] }, then: 'October' },
                { case: { $eq: ['$_id', 11] }, then: 'November' },
                { case: { $eq: ['$_id', 12] }, then: 'December' },
              ],
              default: 'Unknown'
            }
          },
          _id: 0,
          total: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    const byVehicle = await Expense.aggregate([
      matchStage,
      { $match: { vehicle_id: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$vehicle_id',
          total: { $sum: '$amount' }
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
          _id: 0,
          total: 1
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json({ success: true, data: { byCategory, byMonth, byVehicle } });
  } catch (err) {
    next(err);
  }
};
