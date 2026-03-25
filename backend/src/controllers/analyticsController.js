const Vehicle = require('../models/Vehicle');
const DriverProfile = require('../models/DriverProfile');
const Attendance = require('../models/Attendance');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const MaintenanceRecord = require('../models/MaintenanceRecord');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const total_vehicles = await Vehicle.countDocuments();
    const active_vehicles = await Vehicle.countDocuments({ status: 'active' });
    const total_drivers = await DriverProfile.countDocuments({ status: 'active' });
    
    const today_attendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    });

    const [{ fuel_today } = { fuel_today: 0 }] = await FuelLog.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, fuel_today: { $sum: '$fuel_cost' } } }
    ]);

    const [{ monthly_expenses } = { monthly_expenses: 0 }] = await Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: null, monthly_expenses: { $sum: '$amount' } } }
    ]);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const maintenance_due = await MaintenanceRecord.countDocuments({
      next_service_due: { $lte: sevenDaysFromNow },
      status: { $ne: 'completed' }
    });

    const vehicles_in_maintenance = await Vehicle.countDocuments({ status: 'maintenance' });

    // Fuel cost by vehicle (top 10)
    const fuelByVehicleRaw = await FuelLog.aggregate([
      { $match: { date: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: '$vehicle_id', value: { $sum: '$fuel_cost' } } },
      { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
      { $unwind: '$vehicle' },
      { $project: { name: '$vehicle.registration_number', value: 1, _id: 0 } },
      { $sort: { value: -1 } },
      { $limit: 10 }
    ]);
    const fuelByVehicle = fuelByVehicleRaw;

    // Monthly expenses trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyTrendRaw = await Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          expenses: { $sum: '$amount' },
          fuel: { $sum: { $cond: [{ $eq: ['$category', 'fuel'] }, '$amount', 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$category', 'maintenance'] }, '$amount', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyTrendRaw.map(m => ({
      name: `${months[m._id.month - 1]} ${m._id.year}`,
      expenses: m.expenses,
      fuel: m.fuel,
      maintenance: m.maintenance
    }));

    // Attendance trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceTrendRaw = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const attendanceTrend = attendanceTrendRaw.map(a => ({
      name: days[a._id - 1],
      present: a.present,
      absent: a.absent
    }));

    // Expense breakdown by category
    const expenseByCategory = await Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lt: nextMonthStart } } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    // Top expensive vehicles
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const topExpensiveVehicles = await Expense.aggregate([
      { $match: { date: { $gte: yearStart }, vehicle_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$vehicle_id', total_cost: { $sum: '$amount' } } },
      { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
      { $unwind: '$vehicle' },
      { $project: { vehicle: '$vehicle.registration_number', total_cost: 1, _id: 0 } },
      { $sort: { total_cost: -1 } },
      { $limit: 5 }
    ]);

    // Recent activities (recent fuel logs)
    const recentFuelLogs = await FuelLog.find()
      .populate('vehicle_id', 'registration_number')
      .sort({ created_at: -1 })
      .limit(5);

    const recentFuel = recentFuelLogs.map(l => ({
      type: 'fuel',
      date: l.date,
      registration_number: l.vehicle_id ? l.vehicle_id.registration_number : null,
      amount: l.fuel_cost
    }));

    // Maintenance cost trend (last 6 months)
    const maintenanceTrendRaw = await MaintenanceRecord.aggregate([
      { $match: { service_date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$service_date' }, month: { $month: '$service_date' } },
          cost: { $sum: '$cost' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const maintenanceTrend = maintenanceTrendRaw.map(m => ({
      name: `${months[m._id.month - 1]} ${m._id.year}`,
      value: m.cost
    }));

    // Driver Salary Summary (this month)
    const attendanceStats = await Attendance.aggregate([
      { $match: { date: { $gte: monthStart, $lt: nextMonthStart } } },
      {
        $group: {
          _id: '$driver_id',
          present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);

    const driverProfiles = await DriverProfile.find().populate('user_id', 'name');
    const salarySummary = attendanceStats.map(stat => {
      const profile = driverProfiles.find(p => p._id.toString() === stat._id.toString());
      if (!profile) return null;
      return {
        name: profile.user_id?.name || 'Unknown',
        salary: stat.present_days * (profile.daily_salary || 0)
      };
    }).filter(Boolean).sort((a, b) => b.salary - a.salary).slice(0, 5);

    res.json({
      success: true,
      data: {
        kpis: {
          total_vehicles,
          active_vehicles,
          total_drivers,
          today_attendance,
          fuel_today,
          monthly_expenses,
          maintenance_due,
          vehicles_in_maintenance,
        },
        charts: {
          fuelByVehicle,
          monthlyTrend,
          maintenanceTrend,
          attendanceTrend,
          expenseByCategory,
          salarySummary,
          topExpensiveVehicles,
        },
        recentFuel,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getFuelAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00Z`);

    const byVehicle = await FuelLog.aggregate([
      { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
      {
        $group: {
          _id: '$vehicle_id',
          total_cost: { $sum: '$fuel_cost' },
          total_liters: { $sum: '$fuel_quantity_liters' }
        }
      },
      { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
      { $unwind: '$vehicle' },
      {
        $project: {
          name: '$vehicle.registration_number',
          total_cost: 1,
          total_liters: 1,
          cost_per_liter: { $round: [{ $divide: ['$total_cost', '$total_liters'] }, 2] },
          _id: 0
        }
      },
      { $sort: { total_cost: -1 } }
    ]);

    const monthlyRaw = await FuelLog.aggregate([
      { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
      {
        $group: {
          _id: { $month: '$date' },
          cost: { $sum: '$fuel_cost' },
          liters: { $sum: '$fuel_quantity_liters' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = monthlyRaw.map(m => ({
      month: months[m._id - 1],
      cost: m.cost,
      liters: m.liters
    }));

    res.json({ success: true, data: { byVehicle, monthly } });
  } catch (err) {
    next(err);
  }
};

exports.getExpenseAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00Z`);

    const byCategory = await Expense.aggregate([
      { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    const monthlyRaw = await Expense.aggregate([
      { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
      { $sort: { '_id': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = monthlyRaw.map(m => ({
      month: months[m._id - 1],
      total: m.total
    }));

    const [{ total_year } = { total_year: 0 }] = await Expense.aggregate([
      { $match: { date: { $gte: startOfYear, $lt: endOfYear } } },
      { $group: { _id: null, total_year: { $sum: '$amount' } } }
    ]);

    res.json({ success: true, data: { byCategory, monthly, total_year } });
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceAnalytics = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const byDriverRaw = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$driver_id',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'driverprofiles', localField: '_id', foreignField: '_id', as: 'profile' } },
      { $unwind: '$profile' },
      { $lookup: { from: 'users', localField: 'profile.user_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          total: 1,
          present: 1,
          rate: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
          _id: 0
        }
      },
      { $sort: { rate: -1 } }
    ]);

    const dailyRaw = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const daily = dailyRaw.map(d => ({
      day: d._id,
      present: d.present,
      absent: d.absent
    }));

    res.json({ success: true, data: { byDriver: byDriverRaw, daily } });
  } catch (err) {
    next(err);
  }
};
