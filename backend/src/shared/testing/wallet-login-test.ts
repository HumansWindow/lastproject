import axios from 'axios';
import * as ethers from 'ethers';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WALLET_ADDRESSES = [
  '0xbe1db3cafbf22dfcd1510700cdfbb637141a5385',
  '0x47e5f96ac405376052837a757125e9536f908b2f',
  '0x123456789abcdef123456789abcdef123456789a',
];

async function runTest() {
  console.log('Running wallet login test...');

  // Check if debug endpoints are available
  try {
    const healthResponse = await axios.get(`${API_URL}/auth/wallet-debug/health-check`);
    console.log('✅ Debug endpoints are available');
  } catch (error) {
    console.error('❌ Debug endpoints are not available:', error.message);
    process.exit(1);
  }

  // Choose a random wallet from the list
  const walletAddress = WALLET_ADDRESSES[Math.floor(Math.random() * WALLET_ADDRESSES.length)];
  console.log(`Using test wallet address: ${walletAddress}`);

  // Attempt wallet login
  console.log('Attempting wallet login...');
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/wallet-login`, {
      walletAddress,
      message: `Test authentication message for ${walletAddress}`,
      signature: '0xdummysignaturefortesting'
    });

    console.log(`Wallet login response: ${loginResponse.status}`);
    console.log('✅ Login successful!');
    
    const accessToken = loginResponse.data.accessToken;
    console.log(`Access token received: ${accessToken.substring(0, 20)}...`);
    console.log(`Login response structure: ${JSON.stringify(loginResponse.data, null, 2)}`);

    // Try to verify the token using available debug endpoints
    console.log('\nVerifying token using debug endpoint...');
    const endpointsToTry = [
      '/auth/wallet-debug/verify-token',
      '/auth/wallet-debug/user-info',
      '/auth/verify-token',
      '/auth/me',
      '/auth/user-info'
    ];

    let verificationSucceeded = false;
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const verifyResponse = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log(`✅ Token verified via ${endpoint}:`);
        console.log(JSON.stringify(verifyResponse.data, null, 2));
        verificationSucceeded = true;
        break;
      } catch (error) {
        console.log(`Endpoint ${endpoint} not available or returned error: ${error.response?.status}`);
      }
    }

    if (!verificationSucceeded) {
      console.log('❌ No verification endpoints responded successfully.');
      
      // Try POST endpoints for token verification
      try {
        const postVerifyResponse = await axios.post(`${API_URL}/auth/wallet-debug/verify-token`, { token: accessToken });
        console.log(`✅ Token verified via POST /auth/wallet-debug/verify-token:`);
        console.log(JSON.stringify(postVerifyResponse.data, null, 2));
        verificationSucceeded = true;
      } catch (error) {
        console.log('POST token verification endpoint failed as well.');
      }
    }

    // Check if refresh token is included in response
    if (loginResponse.data.refreshToken) {
      console.log('✅ Refresh token available in response');
    } else {
      console.log('❌ No refresh token available in response');
    }

    // Output all response data
    console.log('Response data:', loginResponse.data);

  } catch (error) {
    console.error('❌ Wallet login failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTest();
