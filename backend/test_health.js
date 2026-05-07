const axios = require('axios');

const testBackend = async () => {
  try {
    const res = await axios.get('http://localhost:5000/health');
    console.log('Backend is ALIVE:', res.data);
  } catch (err) {
    console.error('Backend is DEAD or unreachable:', err.message);
  }
};

testBackend();
