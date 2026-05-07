require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./src/models/Route');
const Vehicle = require('./src/models/Vehicle');
const connectDB = require('./src/config/database');

const TAMIL_NADU_DISTRICTS = [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 
    'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 
    'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 
    'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 
    'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 
    'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 
    'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

const seedRoutes = async () => {
    try {
        await connectDB();
        console.log('Connected to database...');

        // Clear existing routes and vehicles if necessary, or just add new ones
        console.log('🗑 Clearing existing routes...');
        await Route.deleteMany({});
        // await Vehicle.deleteMany({ vehicle_type: 'bus' });

        const busTypes = [
            { type: 'AC Sleeper', minPrice: 800, maxPrice: 1200 },
            { type: 'Non-AC Sleeper', minPrice: 500, maxPrice: 700 },
            { type: 'Seater', minPrice: 150, maxPrice: 300 }
        ];

        console.log('Seeding Routes and Buses for ALL district combinations...');
        
        const routesToCreate = [];
        const vehiclesToCreate = [];

        // To avoid massive database bloat, we'll create at least one bus type for EVERY combination,
        // and all 3 bus types for major routes.
        for (const origin of TAMIL_NADU_DISTRICTS) {
            for (const destination of TAMIL_NADU_DISTRICTS) {
                if (origin === destination) continue;

                // Create routes for all combinations
                // We'll alternate bus types to ensure diversity while keeping record count reasonable
                // If you want ALL 3 types for ALL 1400+ combinations, we can do that too (approx 4200 records)
                
                for (const busType of busTypes) {
                    const price = Math.floor(Math.random() * (busType.maxPrice - busType.minPrice + 1)) + busType.minPrice;
                    
                    // Add distance and duration
                    const distKm = Math.floor(Math.random() * 400) + 150; // 150 - 550 km
                    const hours = Math.floor(distKm / 50);
                    const minutes = Math.floor((distKm % 50) * 1.2);
                    const durationStr = `${hours}h ${minutes}m`;
                    const distanceStr = `${distKm} km`;

                    const routeName = `${busType.type}: ${origin} to ${destination}`;
                    
                    routesToCreate.push({
                        name: routeName,
                        origin: origin,
                        destination: destination,
                        stops: [],
                        schedule: [
                            { day: 'Daily', time: '08:00 PM' },
                            { day: 'Daily', time: '10:30 PM' }
                        ],
                        price: price,
                        distance: distanceStr,
                        duration: durationStr,
                        bus_type: busType.type,
                        is_active: true
                    });
                }
            }
            console.log(`Prepared routes for ${origin}...`);
        }

        console.log(`Inserting ${routesToCreate.length} routes...`);
        // Use bulkWrite or insertMany in chunks if it's too large, but 4200 should be fine for insertMany
        await Route.insertMany(routesToCreate);
        
        console.log(`Creating ${vehiclesToCreate.length} vehicles...`);
        // Use try-catch for insertMany because of unique registration_number constraint
        try {
            await Vehicle.insertMany(vehiclesToCreate, { ordered: false });
        } catch (err) {
            console.log('Some vehicles already exist or had duplicate reg numbers, skipped those.');
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedRoutes();
