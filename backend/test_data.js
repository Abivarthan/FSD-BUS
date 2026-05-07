const http = require('http');

// Step 1: Login first to get token
const loginData = JSON.stringify({ email: 'admin@fleetms.com', password: 'Admin@123' });

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  const loginRes = await request({
    hostname: 'localhost', port: 5000,
    path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, loginData);

  if (loginRes.status !== 200) {
    console.log('Login failed:', loginRes.body);
    return;
  }

  const token = loginRes.body.data?.token;
  console.log('✅ Login OK, token acquired');

  // Test adding a vehicle
  const vehicleData = JSON.stringify({
    vehicle_type: 'bus', registration_number: 'TN01AB0001',
    model: 'Tata Starbus', capacity: 52, fuel_type: 'diesel', status: 'active'
  });

  const vehicleRes = await request({
    hostname: 'localhost', port: 5000,
    path: '/api/vehicles', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': vehicleData.length, 'Authorization': `Bearer ${token}` }
  }, vehicleData);

  console.log(`Vehicle create: ${vehicleRes.status}`, vehicleRes.body);

  // Test adding a driver
  const driverData = JSON.stringify({
    name: 'Ravi Kumar', email: 'ravi@busms.com', password: 'Driver@123',
    phone: '9876543210', license_number: 'TN123456', license_expiry: '2028-12-31'
  });

  const driverRes = await request({
    hostname: 'localhost', port: 5000,
    path: '/api/drivers', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': driverData.length, 'Authorization': `Bearer ${token}` }
  }, driverData);

  console.log(`Driver create: ${driverRes.status}`, driverRes.body);
}

main().catch(console.error);
