require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Vehicle = require('./src/models/Vehicle');
const DriverProfile = require('./src/models/DriverProfile');
const Attendance = require('./src/models/Attendance');
const FuelLog = require('./src/models/FuelLog');
const MaintenanceRecord = require('./src/models/MaintenanceRecord');
const Expense = require('./src/models/Expense');
const connectDB = require('./src/config/database');

const seedData = async () => {
    try {
        await connectDB();
        
        // Clear all data
        console.log('🗑  Clearing existing data...');
        await User.deleteMany({});
        await Vehicle.deleteMany({});
        await DriverProfile.deleteMany({});
        await Attendance.deleteMany({});
        await FuelLog.deleteMany({});
        await MaintenanceRecord.deleteMany({});
        await Expense.deleteMany({});

        // 1. Seed Admin
        console.log('👤 Seeding Admin...');
        const adminPassword = await bcrypt.hash('Admin@123', 10);
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@busms.com',
            password: adminPassword,
            role: 'admin'
        });

        // 2. Seed Buses
        console.log('🚌 Seeding Buses...');
        const buses = await Vehicle.create([
            { registration_number: 'TN-01-AX-1010', model: 'Ashok Leyland Viking', capacity: 54, fuel_type: 'diesel', status: 'active', vehicle_type: 'bus' },
            { registration_number: 'TN-01-AX-2020', model: 'Tata Starbus', capacity: 42, fuel_type: 'diesel', status: 'active', vehicle_type: 'bus' },
            { registration_number: 'TN-01-AX-3030', model: 'Eicher Skyline', capacity: 36, fuel_type: 'petrol', status: 'active', vehicle_type: 'bus' },
            { registration_number: 'TN-01-AX-4040', model: 'Volvo 9400 B11R', capacity: 48, fuel_type: 'diesel', status: 'maintenance', vehicle_type: 'bus' },
            { registration_number: 'TN-01-AX-5050', model: 'BharatBenz 917', capacity: 40, fuel_type: 'diesel', status: 'active', vehicle_type: 'bus' }
        ]);

        // 3. Seed Drivers
        console.log('👨‍✈️ Seeding Drivers...');
        const driverPassword = await bcrypt.hash('Driver@123', 10);
        const driverData = [
            { name: 'Karthik Raja', email: 'karthik@busms.com', phone: '9840123456' },
            { name: 'Senthil Kumar', email: 'senthil@busms.com', phone: '9840234567' },
            { name: 'Muthu Krishnan', email: 'muthu@busms.com', phone: '9840345678' },
            { name: 'Vijay Anand', email: 'vijay@busms.com', phone: '9840456789' },
            { name: 'Arun Prakash', email: 'arun@busms.com', phone: '9840567890' }
        ];

        const drivers = [];
        const users = [];
        for (let i = 0; i < driverData.length; i++) {
            const user = await User.create({
                name: driverData[i].name,
                email: driverData[i].email,
                password: driverPassword,
                role: 'driver'
            });

            const profile = await DriverProfile.create({
                user_id: user._id,
                phone: driverData[i].phone,
                license_number: `DL-TN01-${1000 + i}`,
                license_expiry: new Date('2028-12-31'),
                daily_salary: 650 + (i * 50),
                status: 'active'
            });
            
            // Link back to bus for attendance seeding logic
            profile.temp_assigned_vehicle = i < buses.length ? buses[i]._id : null;
            drivers.push(profile);
            users.push(user);
        }

        // 4. Seed Attendance (Last 30 days)
        console.log('📅 Seeding Attendance (30 days)...');
        const attendance = [];
        const now = new Date();
        for (let day = 0; day < 30; day++) {
            const date = new Date(now);
            date.setDate(now.getDate() - day);
            date.setHours(0,0,0,0);

            for (const driver of drivers) {
                // Sunday off (mostly)
                const isSunday = date.getDay() === 0;
                const status = isSunday ? 'leave' : (Math.random() > 0.1 ? 'present' : 'absent');
                
                attendance.push({
                    driver_id: driver._id,
                    vehicle_id: driver.temp_assigned_vehicle,
                    date: date,
                    status: status,
                    check_in_time: status === 'present' ? '08:30' : null,
                    check_out_time: status === 'present' ? '18:00' : null
                });
            }
        }
        await Attendance.insertMany(attendance);

        // 5. Seed Fuel Logs
        console.log('⛽ Seeding Fuel Logs...');
        const fuelLogs = [];
        for (const bus of buses) {
            for (let i = 0; i < 5; i++) {
                const date = new Date(now);
                date.setDate(now.getDate() - (i * 6));
                fuelLogs.push({
                    vehicle_id: bus._id,
                    driver_id: drivers[Math.floor(Math.random() * drivers.length)]._id,
                    date: date,
                    fuel_quantity_liters: 40 + Math.random() * 20,
                    fuel_cost: 4000 + Math.random() * 2000,
                    odometer_reading: 10000 + (i * 500),
                    fuel_station: 'Bharat Petroleum, Anna Salai'
                });
            }
        }
        await FuelLog.insertMany(fuelLogs);

        // 6. Seed Maintenance Records
        console.log('🔧 Seeding Maintenance...');
        const maintenance = [];
        for (const bus of buses) {
            const date = new Date(now);
            date.setDate(now.getDate() - 20);
            maintenance.push({
                vehicle_id: bus._id,
                service_date: date,
                service_type: 'Oil Change & Filter',
                cost: 2500 + Math.random() * 1500,
                notes: 'Routine oil change and air filter replacement.',
                service_provider: 'Local Workshop',
                status: 'completed',
                next_service_due: new Date(date.getTime() + 90 * 24 * 60 * 60 * 1000)
            });
        }
        await MaintenanceRecord.insertMany(maintenance);

        // 7. Seed Expenses
        console.log('💸 Seeding Expenses...');
        const categories = ['fuel', 'maintenance', 'insurance', 'permit', 'tyres', 'other'];
        const expenses = [];
        for (let i = 0; i < 15; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - (i * 2));
            const cat = categories[Math.floor(Math.random() * categories.length)];
            expenses.push({
                category: cat,
                amount: 500 + Math.random() * 5000,
                date: date,
                description: `${cat.charAt(0).toUpperCase() + cat.slice(1)} monthly operational cost`,
                created_by: admin._id,
                vehicle_id: Math.random() > 0.5 ? buses[Math.floor(Math.random() * buses.length)]._id : null
            });
        }
        await Expense.insertMany(expenses);

        console.log('🚀 Seeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
