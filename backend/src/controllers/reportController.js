const FuelLog = require('../models/FuelLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Vehicle = require('../models/Vehicle');
const DriverProfile = require('../models/DriverProfile');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Fixed daily operational charges
const CLEANING_CHARGE = 250;
const MISC_CHARGE = 150;

exports.getFuelReport = async (req, res, next) => {
  try {
    const { start_date, end_date, vehicle_id } = req.query;
    let query = {};
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (vehicle_id) query.vehicle_id = vehicle_id;

    const dataRaw = await FuelLog.find(query)
      .populate('vehicle_id', 'registration_number model fuel_type')
      .populate({ path: 'driver_id', select: 'daily_salary user_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ date: -1 });

    // Compute km_driven + daily cost breakdown for each entry
    const dataPromises = dataRaw.map(async (d) => {
      const fuelCost = Number(d.fuel_cost || 0);
      const driverSalary = d.driver_id ? Number(d.driver_id.daily_salary || 0) : 0;
      const dailyTotal = fuelCost + driverSalary + CLEANING_CHARGE + MISC_CHARGE;

      let km_driven = null;
      if (d.vehicle_id && d.odometer_reading != null) {
        const prevLog = await FuelLog.findOne({
          vehicle_id: d.vehicle_id._id,
          date: { $lt: d.date },
          odometer_reading: { $ne: null },
        }).sort({ date: -1, created_at: -1 }).select('odometer_reading');
        if (prevLog && prevLog.odometer_reading != null) {
          const diff = Number(d.odometer_reading) - Number(prevLog.odometer_reading);
          km_driven = diff > 0 ? diff : null;
        }
      }

      return {
        ...d.toObject(),
        registration_number: d.vehicle_id?.registration_number || null,
        model: d.vehicle_id?.model || null,
        driver_name: d.driver_id?.user_id?.name || null,
        driver_salary: driverSalary,
        cleaning_charge: CLEANING_CHARGE,
        misc_charge: MISC_CHARGE,
        daily_total_cost: dailyTotal,
        km_driven,
      };
    });

    const data = await Promise.all(dataPromises);

    // Summary
    const totalFuelCost = data.reduce((s, d) => s + Number(d.fuel_cost || 0), 0);
    const totalLiters = data.reduce((s, d) => s + Number(d.fuel_quantity_liters || 0), 0);
    const totalDailyOps = data.reduce((s, d) => s + Number(d.daily_total_cost || 0), 0);
    const totalKm = data.reduce((s, d) => s + Number(d.km_driven || 0), 0);

    res.json({
      success: true,
      data,
      summary: {
        entries: data.length,
        total_liters: totalLiters,
        fuel_cost: totalFuelCost,
        daily_ops_cost: totalDailyOps,
        total_km_driven: totalKm,
      }
    });
  } catch (err) { next(err); }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const Attendance = require('../models/Attendance');
    const { start_date, end_date, driver_id } = req.query;
    let query = {};
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (driver_id) query.driver_id = driver_id;

    const dataRaw = await Attendance.find(query)
      .populate({ path: 'driver_id', populate: { path: 'user_id', select: 'name' } })
      .populate('vehicle_id', 'registration_number')
      .sort({ date: -1 });

    const data = dataRaw.map(d => ({
      ...d.toObject(),
      driver_name: d.driver_id?.user_id?.name || null,
      registration_number: d.vehicle_id?.registration_number || null,
    }));

    const [summary] = await Attendance.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }, on_leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } } } }
    ]);

    res.json({ success: true, data, summary: summary || { total: 0, present: 0, absent: 0, on_leave: 0 } });
  } catch (err) { next(err); }
};

exports.getExpenseReport = async (req, res, next) => {
  try {
    const Expense = require('../models/Expense');
    const { start_date, end_date, category, vehicle_id } = req.query;
    let query = {};
    if (start_date || end_date) {
      query.date = {};
      if (start_date) query.date.$gte = new Date(start_date);
      if (end_date) query.date.$lte = new Date(end_date);
    }
    if (category) query.category = category;
    if (vehicle_id) query.vehicle_id = vehicle_id;

    const dataRaw = await Expense.find(query)
      .populate('vehicle_id', 'registration_number')
      .populate('created_by', 'name')
      .sort({ date: -1 });

    const data = dataRaw.map(d => ({
      ...d.toObject(),
      registration_number: d.vehicle_id?.registration_number || null,
      created_by_name: d.created_by?.name || null,
    }));

    const [summary] = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, entries: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({ success: true, data, summary: summary || { entries: 0, total: 0 } });
  } catch (err) { next(err); }
};

exports.getVehicleMonthly = async (req, res, next) => {
  try {
    const { vehicle_id, month, year } = req.query;
    if (!vehicle_id) return res.status(400).json({ success: false, message: 'vehicle_id is required' });

    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01T00:00:00Z`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const [fuelSummary] = await FuelLog.aggregate([
      { $match: { vehicle_id: vehicle._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_cost: { $sum: '$fuel_cost' }, total_liters: { $sum: '$fuel_quantity_liters' }, count: { $sum: 1 } } }
    ]);

    const [maintSummary] = await MaintenanceRecord.aggregate([
      { $match: { vehicle_id: vehicle._id, service_date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_cost: { $sum: '$cost' }, count: { $sum: 1 } } }
    ]);

    const fuelCost = fuelSummary?.total_cost || 0;
    const maintCost = maintSummary?.total_cost || 0;

    res.json({
      success: true,
      data: {
        vehicle: { registration_number: vehicle.registration_number, model: vehicle.model, fuel_type: vehicle.fuel_type },
        month: m, year: y,
        fuel: { cost: fuelCost, liters: fuelSummary?.total_liters || 0, entries: fuelSummary?.count || 0 },
        maintenance: { cost: maintCost, records: maintSummary?.count || 0 },
        total_cost: fuelCost + maintCost,
      }
    });
  } catch (err) { next(err); }
};

exports.exportVehicleMonthlyPDF = async (req, res, next) => {
  try {
    const { vehicle_id, month, year } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01T00:00:00Z`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const [fuelS] = await FuelLog.aggregate([
      { $match: { vehicle_id: vehicle._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_cost: { $sum: '$fuel_cost' }, total_liters: { $sum: '$fuel_quantity_liters' }, count: { $sum: 1 } } }
    ]);

    const [maintS] = await MaintenanceRecord.aggregate([
      { $match: { vehicle_id: vehicle._id, service_date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_cost: { $sum: '$cost' }, count: { $sum: 1 } } }
    ]);

    const fuelCost = fuelS?.total_cost || 0;
    const maintCost = maintS?.total_cost || 0;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${vehicle.registration_number}-${m}-${y}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#1E3A5F').font('Helvetica-Bold').text('BusMS — Vehicle Monthly Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#555').font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563EB').stroke();
    doc.moveDown(1);

    // Vehicle info
    doc.fontSize(14).fillColor('#1E3A5F').font('Helvetica-Bold').text('Vehicle Information');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#333').font('Helvetica');
    doc.text(`Registration Number: ${vehicle.registration_number}`);
    doc.text(`Model: ${vehicle.model}`);
    doc.text(`Fuel Type: ${vehicle.fuel_type}`);
    doc.text(`Report Period: ${monthNames[m]} ${y}`);
    doc.moveDown(1);

    // Summary
    doc.fontSize(14).fillColor('#1E3A5F').font('Helvetica-Bold').text('Monthly Cost Summary');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#333').font('Helvetica');
    doc.text(`Fuel Cost:         ₹${fuelCost.toLocaleString('en-IN')}  (${fuelS?.total_liters?.toFixed(1) || 0} L, ${fuelS?.count || 0} fill-ups)`);
    doc.text(`Maintenance Cost:  ₹${maintCost.toLocaleString('en-IN')}  (${maintS?.count || 0} service records)`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(300, doc.y).strokeColor('#CBD5E1').stroke();
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#2563EB').font('Helvetica-Bold').text(`Total Cost: ₹${(fuelCost + maintCost).toLocaleString('en-IN')}`);
    doc.end();
  } catch (err) { next(err); }
};

exports.exportVehicleMonthlyExcel = async (req, res, next) => {
  try {
    const { vehicle_id, month, year } = req.query;
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const start = new Date(`${y}-${String(m).padStart(2,'0')}-01T00:00:00Z`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const fuelLogs = await FuelLog.find({ vehicle_id: vehicle._id, date: { $gte: start, $lt: end } }).sort({ date: 1 });
    const maintRecords = await MaintenanceRecord.find({ vehicle_id: vehicle._id, service_date: { $gte: start, $lt: end } }).sort({ service_date: 1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'BusMS'; wb.created = new Date();

    // Summary Sheet
    const ws = wb.addWorksheet('Monthly Summary');
    ws.columns = [{ width: 30 }, { width: 20 }];
    ws.addRow(['BusMS — Vehicle Monthly Report']).font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    ws.addRow([]);
    ws.addRow(['Vehicle', vehicle.registration_number]);
    ws.addRow(['Model', vehicle.model]);
    ws.addRow(['Fuel Type', vehicle.fuel_type]);
    ws.addRow(['Report Period', `${monthNames[m]} ${y}`]);
    ws.addRow([]);
    ws.addRow(['Category', 'Amount (INR)']).font = { bold: true };
    const fuelTotal = fuelLogs.reduce((s, l) => s + (l.fuel_cost || 0), 0);
    const maintTotal = maintRecords.reduce((s, r) => s + (r.cost || 0), 0);
    ws.addRow(['Fuel Cost', fuelTotal]);
    ws.addRow(['Maintenance Cost', maintTotal]);
    ws.addRow(['TOTAL', fuelTotal + maintTotal]).font = { bold: true, color: { argb: 'FF2563EB' } };

    // Fuel Sheet
    const wsF = wb.addWorksheet('Fuel Logs');
    wsF.columns = [{ header: 'Date', key: 'date', width: 15 }, { header: 'Liters', key: 'liters', width: 12 }, { header: 'Cost (₹)', key: 'cost', width: 15 }, { header: 'Odometer', key: 'odo', width: 14 }, { header: 'Station', key: 'station', width: 20 }];
    wsF.getRow(1).font = { bold: true };
    fuelLogs.forEach(l => wsF.addRow({ date: new Date(l.date).toLocaleDateString('en-IN'), liters: l.fuel_quantity_liters, cost: l.fuel_cost, odo: l.odometer_reading, station: l.fuel_station || '' }));

    // Maintenance Sheet
    const wsM = wb.addWorksheet('Maintenance');
    wsM.columns = [{ header: 'Date', key: 'date', width: 15 }, { header: 'Service Type', key: 'type', width: 22 }, { header: 'Cost (₹)', key: 'cost', width: 15 }, { header: 'Provider', key: 'provider', width: 20 }, { header: 'Next Due', key: 'next', width: 15 }];
    wsM.getRow(1).font = { bold: true };
    maintRecords.forEach(r => wsM.addRow({ date: new Date(r.service_date).toLocaleDateString('en-IN'), type: r.service_type, cost: r.cost, provider: r.service_provider || '', next: r.next_service_due ? new Date(r.next_service_due).toLocaleDateString('en-IN') : '' }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="report-${vehicle.registration_number}-${m}-${y}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};
