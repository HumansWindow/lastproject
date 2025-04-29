import axios from 'axios';
import * as ethers from 'ethers';

const API_URL = process.env.API_URL || 'http://localhost:3001';
// Generate a random private key for testing
const TEST_PRIVATE_KEY = ethers.utils.randomBytes(32);
const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);

/**
 * Comprehensive wallet authentication test
 */
async function runComprehensiveTest() {
  console.log('🔍 Starting comprehensive wallet authentication test');
  
  const walletAddress = await wallet.getAddress();
  console.log(`📝 Test wallet address: ${walletAddress}`);
  
  try {
    // Step 1: Check debug mode
    console.log('\n🔧 Checking debug mode...');
    const debugCheck = await axios.get(`${API_URL}/auth/wallet-debug/health-check`);
    console.log(`✅ Debug mode active: ${JSON.stringify(debugCheck.data, null, 2)}`);
    
    if (!debugCheck.data.bypassSignature) {
      console.warn('⚠️ Warning: BYPASS_WALLET_SIGNATURE is not enabled, test may fail on signature verification');
    }
    
    // Step 2: Use mock authentication endpoint for testing
    console.log('\n🧪 Testing mock authentication...');
    const mockAuthResponse = await axios.post(
      `${API_URL}/auth/wallet-debug/mock-authenticate`,
      { walletAddress }
    );
    console.log('✅ Mock authentication successful:');
    console.log(JSON.stringify(mockAuthResponse.data, null, 2));

    // Extract token and user info
    const { accessToken, user } = mockAuthResponse.data;
    console.log(`🎟️ Access Token received: ${accessToken.substring(0, 20)}...`);
    console.log(`👤 User ID: ${user?.id}`);
    
    if (!accessToken) {
      throw new Error('No access token received from authentication');
    }
    
    // Step 3: Verify the token
    console.log('\n🔍 Verifying token...');

    // Create list of endpoints to try
    const endpointsToTry = [
      { method: 'GET', url: '/auth/wallet-debug/verify-token', headers: { Authorization: `Bearer ${accessToken}` } },
      { method: 'POST', url: '/auth/wallet-debug/verify-token', data: { token: accessToken } },
      { method: 'POST', url: '/auth/wallet-debug/validate-token', data: { token: accessToken } },
      { method: 'GET', url: '/auth/wallet-debug/user-info', headers: { Authorization: `Bearer ${accessToken}` } },
    ];

    let verificationSucceeded = false;
    let verificationResponse = null;

    // Try each endpoint until one succeeds
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Trying ${endpoint.method} ${endpoint.url}...`);
        const response = endpoint.method === 'GET' 
          ? await axios.get(`${API_URL}${endpoint.url}`, { headers: endpoint.headers })
          : await axios.post(`${API_URL}${endpoint.url}`, endpoint.data);
          
        console.log(`✅ Endpoint ${endpoint.url} responded with status ${response.status}`);
        verificationSucceeded = true;
        verificationResponse = response.data;
        break;
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint.url} failed: ${error.message}`);
        if (error.response) {
          console.log(`Status: ${error.response.status}, Data:`, error.response.data);
        }
      }
    }

    if (!verificationSucceeded) {
      console.error('❌ None of the token verification endpoints worked.');
    } else {
      console.log('Token verification response:');
      console.log(JSON.stringify(verificationResponse, null, 2));
    }

    // Decode the token manually to verify its contents
    console.log('\n🔎 Manually decoding token:');
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('Token payload:', payload);
      
      // Verify the user ID in the token matches the user ID from the response
      if (payload.sub === user?.id) {
        console.log('✅ Token subject matches user ID');
      } else {
        console.log('❌ Token subject does not match user ID');
      }
    }

    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`- Wallet Address: ${walletAddress}`);
    console.log(`- Authentication: ${mockAuthResponse.status === 200 ? '✅ Success' : '❌ Failed'}`);
    console.log(`- Token Verification: ${verificationSucceeded ? '✅ Success' : '❌ Failed'}`);
    console.log(`- User ID: ${user?.id || 'Not available'}`);
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runComprehensiveTest();
