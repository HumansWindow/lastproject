import { AuthTestUtil } from './auth-test.util';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables from .env.test file
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });
console.log(`Loaded environment from: ${envPath}`);

/**
 * This script tests the authentication flow by:
 * 1. Attempting a wallet login with a mock signature
 * 2. Verifying the received access token works
 * 
 * To run this test:
 * 1. Make sure the backend is running with BYPASS_WALLET_SIGNATURE=true
 * 2. Execute this script with: npx ts-node auth-test.script.ts
 */
async function runAuthTest() {
  console.log('🔒 Starting Authentication Flow Test');
  console.log('====================================');
  
  // API endpoint configuration
  const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';
  const testWalletAddress = '0x' + '1234567890abcdef1234567890abcdef12345678';
  const testEmail = 'test@example.com';
  
  console.log(`📡 API URL: ${apiBaseUrl}`);
  console.log(`👛 Test wallet address: ${testWalletAddress}`);
  console.log(`📨 Test email: ${testEmail}`);
  console.log(`🔧 Test mode: ${process.env.NODE_ENV}`);
  console.log(`🚫 Bypass signature: ${process.env.BYPASS_WALLET_SIGNATURE}`);
  console.log(`🚫 Skip token storage: ${process.env.SKIP_REFRESH_TOKEN_STORAGE}`);
  
  // Check if API is accessible first
  try {
    console.log('\n🔄 Checking API availability...');
    await axios.get(`${apiBaseUrl}/health`, { timeout: 5000 })
      .then(response => console.log(`✅ API is available: ${response.status} ${response.statusText}`))
      .catch(err => {
        console.error(`❌ API check failed: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
          console.error('🛑 API server appears to be offline. Please start the API server first.');
          process.exit(1);
        }
      });
  } catch (error) {
    console.error(`❌ API availability check failed: ${error.message}`);
    // Continue anyway - the specific endpoints might still work
  }
  
  try {
    // Step 1: Attempt wallet login
    console.log('\n🔑 Testing wallet login...');
    const loginResult = await AuthTestUtil.testWalletLogin(
      apiBaseUrl,
      testWalletAddress,
      testEmail
    );
    
    if (!loginResult.success) {
      console.error('❌ Wallet login failed:', loginResult.error);
      console.log('📝 Full error details:', JSON.stringify(loginResult.details || {}, null, 2));
      return;
    }
    
    console.log('✅ Wallet login successful!');
    console.log('📝 Login response:', JSON.stringify(loginResult.data, null, 2));
    
    // Extract access token
    const accessToken = loginResult.data.accessToken;
    
    if (!accessToken) {
      console.error('❌ No access token received in response');
      return;
    }
    
    // Step 2: Verify the access token works
    console.log('\n🔐 Testing access token validation...');
    const tokenVerification = await AuthTestUtil.verifyAccessToken(apiBaseUrl, accessToken);
    
    if (!tokenVerification.success) {
      console.error('❌ Token validation failed:', tokenVerification.error);
      console.log('📝 Full error details:', JSON.stringify(tokenVerification.details || {}, null, 2));
      return;
    }
    
    console.log('✅ Access token validated successfully!');
    console.log('👤 User data:', JSON.stringify(tokenVerification.data, null, 2));
    
    console.log('\n🎉 Authentication flow test PASSED!');
    console.log('====================================');
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
  }
}

// Run the test
runAuthTest()
  .then(() => console.log('Test execution completed'))
  .catch(err => console.error('Test execution failed:', err));
