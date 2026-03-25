const Attendance = require('../models/Attendance');
const DriverProfile = require('../models/DriverProfile');

exports.getMonthly = async (req, res, next) => {
  try {
    const { month, year, driver_id } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();

    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01T00:00:00Z`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);

    const matchStage = { date: { $gte: start, $lt: end } };
    if (driver_id) matchStage.driver_id = new (require('mongoose').Types.ObjectId)(driver_id);

    // Aggregate attendance per driver
    const attendanceStats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$driver_id',
          present_days: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent_days: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          leave_days: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
        }
      }
    ]);

    // For each driver, fetch their profile and calculate salary
    const results = await Promise.all(attendanceStats.map(async (stat) => {
      const profile = await DriverProfile.findById(stat._id).populate('user_id', 'name email');
      if (!profile) return null;

      const daily_salary = profile.daily_salary || 0;
      const monthly_salary = stat.present_days * daily_salary;

      return {
        driver_id: profile._id,
        name: profile.user_id?.name || 'Unknown',
        email: profile.user_id?.email || '',
        present_days: stat.present_days,
        absent_days: stat.absent_days,
        leave_days: stat.leave_days,
        daily_salary,
        monthly_salary,
      };
    }));

    const data = results.filter(Boolean);
    const total_payroll = data.reduce((sum, d) => sum + d.monthly_salary, 0);

    res.json({ success: true, data, summary: { month: m, year: y, total_payroll } });
  } catch (err) {
    next(err);
  }
};
