const http = require('http');

const loginData = JSON.stringify({ email: 'admin@busms.com', password: 'Admin@123' });

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Logging in...');
  const loginRes = await request({
    hostname: 'localhost', port: 5000,
    path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, loginData);

  console.log(`Login Status: ${loginRes.status}`);
  const loginBody = JSON.parse(loginRes.body);
  const token = loginBody.data?.token;

  if (!token) {
    console.error('Failed to get token');
    return;
  }

  console.log('Fetching dashboard data...');
  const dashRes = await request({
    hostname: 'localhost', port: 5000,
    path: '/api/analytics/dashboard', method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log(`Dashboard Status: ${dashRes.status}`);
  const dashData = JSON.parse(dashRes.body);
  console.log('KPIs:', JSON.stringify(dashData.data?.kpis, null, 2));
}

main().catch(console.error);
