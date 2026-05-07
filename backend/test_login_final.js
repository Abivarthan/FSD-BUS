const testLogin = async () => {
  const loginData = [
    { email: 'admin@fleetms.com', password: 'Admin@123', role: 'admin' },
    { email: 'customer@fleetms.com', password: 'Customer@123', role: 'customer' }
  ];

  for (const cred of loginData) {
    try {
      console.log(`\n🧪 Testing login for ${cred.role} (${cred.email})...`);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ ${cred.role} login successful!`);
        console.log(`🔑 Token: ${data.data.token.substring(0, 20)}...`);
        console.log(`👤 Name: ${data.data.user.name}`);
      } else {
        console.log(`❌ ${cred.role} login failed: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${cred.role} login:`, error.message);
    }
    console.log('---');
  }
};

testLogin();
