import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });
console.log(`Loaded environment from: ${envPath}`);

/**
 * Test script to use the debug endpoint for wallet authentication
 * This bypasses regular validation to focus on testing the core auth logic
 */
async function testWalletDebug() {
  console.log('🔧 Wallet Authentication Debug Test');
  console.log('==================================');
  
  // Configuration
  const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';
  const testWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const testEmail = 'test@example.com';
  
  console.log(`📡 API URL: ${apiBaseUrl}`);
  console.log(`👛 Test wallet address: ${testWalletAddress}`);
  
  // Check if API is available
  try {
    console.log('\n🔄 Checking API availability...');
    await axios.get(`${apiBaseUrl}/health`)
      .then(response => console.log(`✅ API is available: ${response.status} ${response.statusText}`))
      .catch(error => {
        console.error(`❌ API check failed: ${error.message}`);
        process.exit(1);
      });
  } catch (error) {
    console.error(`❌ API check error: ${error.message}`);
    process.exit(1);
  }
  
  try {
    console.log('\n🔑 Testing wallet debug authentication...');
    
    // Generate a simple mock payload
    const payload = {
      address: testWalletAddress,
      message: `Test message at ${new Date().toISOString()}`,
      signature: '0x' + crypto.randomBytes(65).toString('hex').substring(0, 130),
      email: testEmail
    };
    
    console.log('📝 Payload:', JSON.stringify(payload, null, 2));
    
    // Use the debug endpoint instead of the regular login
    const response = await axios.post(
      `${apiBaseUrl}/auth/wallet-debug/mock-authenticate`, 
      payload,
      { 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
    console.log('✅ Authentication successful!');
    console.log('📝 Response:', JSON.stringify(response.data, null, 2));
    
    // If we got an access token, try to verify it
    if (response.data && response.data.accessToken) {
      console.log('\n🔐 Verifying access token...');
      const accessToken = response.data.accessToken;
      const userId = response.data.user?.id;
      
      // Try multiple endpoints to verify the token is working
      try {
        // First try /users/me endpoint which is commonly used for getting current user
        const tokenResponse = await axios.get(
          `${apiBaseUrl}/users/me`, 
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        console.log('✅ Token verification successful on /users/me!');
        console.log('👤 User profile:', JSON.stringify(tokenResponse.data, null, 2));
        return; // Success! Exit the function
      } 
      catch (meError) {
        console.log('⚠️ Failed to verify token on /users/me endpoint, trying alternatives...');
        
        // Try another endpoint - user specific endpoint with ID
        if (userId) {
          try {
            const userResponse = await axios.get(
              `${apiBaseUrl}/users/${userId}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            );
            
            console.log(`✅ Token verification successful on /users/${userId}!`);
            console.log('👤 User data:', JSON.stringify(userResponse.data, null, 2));
            return; // Success! Exit the function
          }
          catch (userError) {
            console.log(`⚠️ Failed to verify token on /users/${userId} endpoint...`);
          }
        }
        
        // Last resort - just verify the token is valid format by checking auth endpoint
        try {
          const authCheckResponse = await axios.get(
            `${apiBaseUrl}/auth/profile`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          );
          
          console.log('✅ Token verification successful on /auth/profile!');
          console.log('👤 Auth profile:', JSON.stringify(authCheckResponse.data, null, 2));
          return; // Success! Exit the function
        }
        catch (authError) {
          // All token verification methods failed
          console.error('❌ All token verification attempts failed. The token may be invalid.');
          console.error('Error details:', authError.response?.data || authError.message);
        }
      }
      
      // If we get here, try one more approach - decode the JWT to see if it looks valid
      try {
        console.log('\n🔍 Checking JWT token structure...');
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          console.log('Token header:', header);
          console.log('Token payload:', payload);
          
          if (payload.sub === userId) {
            console.log('✅ JWT payload contains correct user ID. Token structure looks valid.');
          } else {
            console.log('⚠️ JWT subject does not match user ID!');
          }
        }
      }
      catch (decodeError) {
        console.error('Failed to decode JWT:', decodeError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
}

// Run the test
testWalletDebug()
  .then(() => console.log('\n🎯 Debug test completed'))
  .catch(err => console.error('\n❌ Debug test failed:', err));
