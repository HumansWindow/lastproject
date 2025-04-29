import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

/**
 * Simple test to verify a JWT token without requiring specific endpoints
 * @param token The JWT token to verify
 * @param userId Optional user ID to check against the token subject
 */
function decodeAndVerifyToken(token: string, userId?: string): void {
  console.log('🔍 Analyzing JWT token...');
  
  if (!token) {
    console.error('❌ No token provided!');
    return;
  }
  
  try {
    // Split and decode the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format! Expected 3 parts separated by dots.');
      return;
    }
    
    // Decode header and payload
    const headerStr = Buffer.from(parts[0], 'base64').toString();
    const payloadStr = Buffer.from(parts[1], 'base64').toString();
    
    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);
    
    console.log('Token header:', header);
    console.log('Token payload:', payload);
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('❌ Token is expired!', {
        expiration: new Date(payload.exp * 1000).toISOString(),
        now: new Date().toISOString()
      });
    } else {
      console.log('✅ Token is not expired');
    }
    
    // Check if user ID matches
    if (userId && payload.sub) {
      if (payload.sub === userId) {
        console.log('✅ Token subject matches provided user ID');
      } else {
        console.log('⚠️ Token subject does not match provided user ID!', {
          tokenSubject: payload.sub,
          providedUserId: userId
        });
      }
    }
    
    console.log('✅ Token structure is valid');
  } catch (error) {
    console.error('❌ Failed to decode token:', error.message);
  }
}

/**
 * Main function to test a token's validity
 */
async function testToken() {
  // You can paste a token here for testing
  const token = process.argv[2];
  const userId = process.argv[3];
  
  if (!token) {
    console.log('Please provide a token as the first argument');
    console.log('Usage: npx ts-node src/shared/testing/token-test.ts <token> [userId]');
    return;
  }
  
  console.log('🔒 JWT Token Verification Tool');
  console.log('=============================');
  
  // Decode and check the token structure
  decodeAndVerifyToken(token, userId);
  
  // Check if the API accepts this token
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  
  try {
    console.log('\n🔄 Testing token against API...');
    
    // Try multiple endpoints where the token might be accepted
    const endpoints = [
      '/users/me',
      '/auth/profile',
      '/users/profile'
    ];
    
    let succeeded = false;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${apiUrl}${endpoint}`);
        
        const response = await axios.get(`${apiUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        
        console.log(`✅ Success on ${endpoint}! Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        succeeded = true;
        break;
      } catch (error) {
        console.log(`❌ Failed on ${endpoint}: ${error.response?.status || error.message}`);
      }
    }
    
    if (!succeeded) {
      console.log('❌ Token was not accepted by any API endpoint');
    }
  } catch (error) {
    console.error('❌ Error testing token:', error.message);
  }
}

// Run the test
testToken()
  .then(() => console.log('\n✅ Token test complete'))
  .catch(err => console.error('\n❌ Token test failed:', err));
