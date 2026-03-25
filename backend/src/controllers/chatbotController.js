const FuelLog = require('../models/FuelLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Vehicle = require('../models/Vehicle');
const DriverProfile = require('../models/DriverProfile');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');

// Helper to get current month bounds
const monthBounds = (month, year) => {
  const m = month ? parseInt(month) : new Date().getMonth() + 1;
  const y = year ? parseInt(year) : new Date().getFullYear();
  const start = new Date(`${y}-${String(m).padStart(2,'0')}-01T00:00:00Z`);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  return { start, end, m, y };
};

// Analytics queries for chatbot
const getFuelSummary = async (month, year) => {
  const { start, end, m, y } = monthBounds(month, year);
  const result = await FuelLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total_liters: { $sum: '$fuel_quantity_liters' }, total_cost: { $sum: '$fuel_cost' }, entries: { $sum: 1 } } }
  ]);
  const s = result[0] || {};
  return `Fuel Summary for ${String(m).padStart(2,'0')}/${y}:\n• Total Entries: ${s.entries || 0}\n• Total Liters: ${(s.total_liters || 0).toFixed(1)} L\n• Total Cost: ₹${(s.total_cost || 0).toLocaleString('en-IN')}`;
};

const getMaintenanceDue = async () => {
  const now = new Date();
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
  const records = await MaintenanceRecord.find({ next_service_due: { $lte: in7 }, status: 'completed' })
    .populate('vehicle_id', 'registration_number model');
  if (!records.length) return 'No vehicles have maintenance due in the next 7 days. ✅';
  const lines = records.map(r => `• ${r.vehicle_id?.registration_number} (${r.vehicle_id?.model}) — Due: ${r.next_service_due?.toLocaleDateString('en-IN')}`);
  return `Vehicles needing maintenance soon:\n${lines.join('\n')}`;
};

const getTopFuelVehicle = async () => {
  const { start, end } = monthBounds(null, null);
  const result = await FuelLog.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: '$vehicle_id', total_cost: { $sum: '$fuel_cost' } } },
    { $sort: { total_cost: -1 } }, { $limit: 3 },
    { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'v' } },
    { $unwind: '$v' }
  ]);
  if (!result.length) return 'No fuel data available for this month.';
  const lines = result.map((r, i) => `${i+1}. ${r.v.registration_number} — ₹${r.total_cost.toLocaleString('en-IN')}`);
  return `Top Fuel Cost Vehicles (this month):\n${lines.join('\n')}`;
};

const getDriverAttendanceSummary = async () => {
  const { start, end } = monthBounds(null, null);
  const result = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: '$driver_id', present: { $sum: { $cond: [{ $eq: ['$status','present'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status','absent'] }, 1, 0] } } } },
    { $lookup: { from: 'driverprofiles', localField: '_id', foreignField: '_id', as: 'd' } },
    { $unwind: '$d' },
    { $lookup: { from: 'users', localField: 'd.user_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' }, { $limit: 5 }
  ]);
  if (!result.length) return 'No attendance data found for this month.';
  const lines = result.map(r => `• ${r.u.name}: ${r.present} present, ${r.absent} absent`);
  return `Attendance Summary (this month):\n${lines.join('\n')}`;
};

const getVehicleCount = async () => {
  const total = await Vehicle.countDocuments();
  const active = await Vehicle.countDocuments({ status: 'active' });
  const maintenance = await Vehicle.countDocuments({ status: 'maintenance' });
  return `Fleet Overview:\n• Total Buses: ${total}\n• Active: ${active}\n• In Maintenance: ${maintenance}`;
};

const getExpenseSummary = async () => {
  const { start, end, m, y } = monthBounds(null, null);
  const result = await Expense.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } }
  ]);
  if (!result.length) return 'No expense data for this month.';
  const lines = result.map(r => `• ${r._id}: ₹${r.total.toLocaleString('en-IN')}`);
  const total = result.reduce((a, r) => a + r.total, 0);
  return `Expense Breakdown for ${String(m).padStart(2,'0')}/${y}:\n${lines.join('\n')}\n──────────────\n• TOTAL: ₹${total.toLocaleString('en-IN')}`;
};

// Rule-based response engine
const getResponse = async (message) => {
  const msg = message.toLowerCase().trim();

  // Navigation help
  if (msg.includes('add') && msg.includes('vehicle') || msg.includes('new vehicle') || msg.includes('create vehicle')) {
    return { reply: '🚌 To add a new bus:\n1. Go to **Buses** in the sidebar\n2. Click **Add Vehicle** (+ button, top right)\n3. Fill in: Registration Number, Model, Capacity, Fuel Type\n4. Click **Save Vehicle**\n\nThe bus will appear in your fleet list immediately.' };
  }
  if (msg.includes('add') && msg.includes('driver') || msg.includes('new driver') || msg.includes('create driver')) {
    return { reply: '👤 To add a new driver:\n1. Go to **Drivers** in the sidebar\n2. Click **Add Driver**\n3. Enter: Name, Email, Phone, License Number, Daily Salary\n4. Click **Save**\n\nA login account is created automatically with password `Driver@123`.' };
  }
  if (msg.includes('attendance') && (msg.includes('how') || msg.includes('mark') || msg.includes('add'))) {
    return { reply: '📅 To mark attendance:\n1. Go to **Attendance** in the sidebar\n2. Click **Mark Attendance**\n3. Select: Driver, Date, Status (Present/Absent/Leave)\n4. Optionally add Vehicle and Check-in time\n5. Click **Save**\n\nAdmin manually enters all attendance records.' };
  }
  if (msg.includes('report') || msg.includes('generate report') || msg.includes('monthly report')) {
    return { reply: '📊 To generate reports:\n1. Go to **Reports** in the sidebar\n2. Select report type: Fuel / Attendance / Expense\n3. Set date range filters\n4. View results on screen\n5. Use **Export PDF** or **Export Excel** for vehicle monthly reports\n\nGo to Reports → Vehicle Monthly → Select vehicle + month → Export.' };
  }
  if (msg.includes('fuel') && (msg.includes('add') || msg.includes('log') || msg.includes('record'))) {
    return { reply: '⛽ To add a fuel log:\n1. Go to **Fuel Logs** in the sidebar\n2. Click **Add Fuel Log**\n3. Select Vehicle, Driver, Date\n4. Enter Liters, Cost, Odometer\n5. Optionally upload fuel bill image\n6. Click **Save**' };
  }
  if (msg.includes('maintenance') && (msg.includes('add') || msg.includes('log') || msg.includes('record') || msg.includes('schedule'))) {
    return { reply: '🔧 To add a maintenance record:\n1. Go to **Maintenance** in the sidebar\n2. Click **Add Record**\n3. Select Vehicle, Service Type, Date, Cost\n4. Set Next Service Due date\n5. Upload service bill image (optional)\n6. Click **Save**' };
  }
  if (msg.includes('salary') || msg.includes('pay') || msg.includes('wage')) {
    return { reply: '💰 Driver Salary System:\n• Salary = Present Days × Daily Salary\n• Go to **Drivers** page to set each driver\'s daily salary\n• Go to **Reports** → **Salary Report** to view monthly salary summary\n• Salary is auto-calculated from attendance records' };
  }
  if (msg.includes('export') && msg.includes('pdf')) {
    return { reply: '📄 To export PDF:\n1. Go to **Reports** in the sidebar\n2. Select **Vehicle Monthly Report**\n3. Choose vehicle, month, and year\n4. Click **Export PDF**\n\nThe PDF includes: Vehicle details, Fuel cost, Maintenance cost, Total expenses.' };
  }
  if (msg.includes('export') && msg.includes('excel')) {
    return { reply: '📊 To export Excel:\n1. Go to **Reports** → **Vehicle Monthly Report**\n2. Select vehicle, month, year\n3. Click **Export Excel**\n\nThe Excel file includes all expense breakdowns per vehicle.' };
  }
  if (msg.includes('upload') && (msg.includes('bill') || msg.includes('image') || msg.includes('photo'))) {
    return { reply: '📎 To upload a bill image:\n• **Fuel Bill**: Go to Fuel Logs → Add/Edit → Upload Bill Image field\n• **Service Bill**: Go to Maintenance → Add/Edit → Upload Bill Image field\n\nSupported formats: JPG, PNG, JPEG, PDF (max 5MB)\nImages are stored and viewable by clicking the bill icon.' };
  }

  // Analytics queries
  if (msg.includes('fuel cost') || msg.includes('fuel summary') || msg.includes('fuel this month') || msg.includes('fuel expense')) {
    const reply = await getFuelSummary();
    return { reply: `⛽ ${reply}` };
  }
  if (msg.includes('maintenance due') || msg.includes('service due') || msg.includes('need maintenance') || msg.includes('upcoming service')) {
    const reply = await getMaintenanceDue();
    return { reply: `🔧 ${reply}` };
  }
  if ((msg.includes('highest') || msg.includes('most expensive') || msg.includes('top')) && msg.includes('fuel')) {
    const reply = await getTopFuelVehicle();
    return { reply: `🏆 ${reply}` };
  }
  if (msg.includes('attendance') && (msg.includes('summary') || msg.includes('report') || msg.includes('this month'))) {
    const reply = await getDriverAttendanceSummary();
    return { reply: `📅 ${reply}` };
  }
  if (msg.includes('vehicle') && (msg.includes('count') || msg.includes('total') || msg.includes('how many') || msg.includes('fleet'))) {
    const reply = await getVehicleCount();
    return { reply: `🚌 ${reply}` };
  }
  if (msg.includes('expense') && (msg.includes('summary') || msg.includes('this month') || msg.includes('breakdown') || msg.includes('total'))) {
    const reply = await getExpenseSummary();
    return { reply: `💸 ${reply}` };
  }

  // Greetings
  if (msg.match(/^(hi|hello|hey|helo|hai)[\s!.]*$/)) {
    return { reply: '👋 Hello! I\'m your BusMS Assistant.\n\nI can help you with:\n• 🚌 Adding buses & drivers\n• ⛽ Fuel logs & bill uploads\n• 🔧 Maintenance records\n• 📅 Attendance management\n• 💰 Salary calculation\n• 📊 Reports & analytics\n\nWhat would you like to know?' };
  }
  if (msg.includes('help') || msg.includes('what can you') || msg.includes('what do you')) {
    return { reply: '🤖 BusMS Assistant can help you:\n\n**Navigation**\n• "How to add a vehicle?"\n• "How to mark attendance?"\n• "How to generate a report?"\n\n**Analytics**\n• "Fuel cost this month"\n• "Which vehicles need maintenance?"\n• "Show expense summary"\n• "Top fuel vehicle"\n• "Attendance summary"\n• "How many vehicles do we have?"' };
  }
  if (msg.includes('thank')) {
    return { reply: '😊 You\'re welcome! Let me know if you need anything else.' };
  }

  // Default
  return { reply: '🤔 I\'m not sure about that. Try asking:\n\n• "Fuel cost this month"\n• "Which vehicles need maintenance?"\n• "How to add a driver?"\n• "Expense summary"\n• "Top fuel vehicle"\n\nOr type **help** to see all I can do.' };
};

exports.query = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const result = await getResponse(message.trim());
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
