// This is a simple debug script to test the wallet authentication endpoint
const fetch = require('node-fetch');

async function testWalletEndpoint() {
  try {
    console.log('Testing wallet authentication endpoint...');
    
    const response = await fetch('http://localhost:3001/auth/wallet/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0xD2D53A3E16cf5dd2634Dd376bDc7CE81bD0F76Ff',
      }),
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', data);
  } catch (error) {
    console.error('Error testing wallet endpoint:', error);
  }
}

testWalletEndpoint();
