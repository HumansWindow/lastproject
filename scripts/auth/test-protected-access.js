#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
// Replace this with the actual token you received from the login
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error('Please provide an access token as the first argument');
  console.error('Usage: ./test-protected-access.js <access_token>');
  process.exit(1);
}

async function testEndpoint(endpoint, method = 'get', data = null) {
  try {
    console.log(`Testing endpoint: ${endpoint} [${method.toUpperCase()}]`);
    
    const config = {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await axios.get(`${API_URL}${endpoint}`, config);
    } else if (method.toLowerCase() === 'post') {
      response = await axios.post(`${API_URL}${endpoint}`, data, config);
    }
    
    console.log(`✅ SUCCESS: ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ FAILED: ${endpoint}`);
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    // Print detailed token information if unauthorized
    if (error.response?.status === 401) {
      console.log('\n🔍 Token Analysis:');
      try {
        const tokenParts = ACCESS_TOKEN.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Token payload:', JSON.stringify(payload, null, 2));
          
          // Check token expiration
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            console.log(`Token expiration: ${expDate.toISOString()}`);
            console.log(`Current time: ${now.toISOString()}`);
            console.log(`Token ${expDate > now ? 'is still valid' : 'has expired'}`);
          }
        } else {
          console.log('Invalid JWT format');
        }
      } catch (err) {
        console.log('Could not parse token:', err.message);
      }
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
}

async function main() {
  console.log('=== JWT Protected Resource Access Test ===');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  
  // Test multiple endpoints
  const endpoints = [
    { path: '/auth/me', method: 'get' },
    { path: '/users/profile', method: 'get' },
    { path: '/auth/verify-token', method: 'post', data: { token: ACCESS_TOKEN } },
    { path: '/user/devices', method: 'get' },
    // Add more protected endpoints here
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.path, endpoint.method, endpoint.data);
    console.log('---');
  }
}

main().catch(err => {
  console.error('Test failed with error:', err.message);
});
