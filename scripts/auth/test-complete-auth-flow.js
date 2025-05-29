#!/usr/bin/env node
/**
 * Comprehensive Authentication Test Script
 * 
 * This script tests the complete wallet authentication flow:
 * 1. Establishes a connection to the backend
 * 2. Requests a challenge for wallet authentication
 * 3. Signs the challenge using a test wallet
 * 4. Authenticates using the signature
 * 5. Verifies the received tokens
 * 6. Tests token refresh
 * 7. Tests accessing a protected endpoint
 */

const axios = require('axios');
const ethers = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config({ path: '../../backend/.env' });

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY || '0x0123456789012345678901234567890123456789012345678901234567890123';
const TEST_WALLET = new ethers.Wallet(TEST_WALLET_PRIVATE_KEY);
const TEST_WALLET_ADDRESS = TEST_WALLET.address;

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with formatting and colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'success':
      console.log(`${COLORS.green}[${timestamp}] ✅ ${message}${COLORS.reset}`);
      break;
    case 'error':
      console.log(`${COLORS.red}[${timestamp}] ❌ ${message}${COLORS.reset}`);
      break;
    case 'warn':
      console.log(`${COLORS.yellow}[${timestamp}] ⚠️ ${message}${COLORS.reset}`);
      break;
    case 'step':
      console.log(`${COLORS.cyan}[${timestamp}] 🔄 ${message}${COLORS.reset}`);
      break;
    case 'info':
    default:
      console.log(`${COLORS.blue}[${timestamp}] ℹ️ ${message}${COLORS.reset}`);
  }
}

/**
 * Generate a device fingerprint for testing
 */
function generateDeviceFingerprint() {
  return crypto.createHash('sha256')
    .update(`test-device-${Date.now()}`)
    .digest('hex');
}

/**
 * Run the complete authentication flow test
 */
async function runAuthTest() {
  const deviceFingerprint = generateDeviceFingerprint();
  log('Starting complete authentication flow test', 'step');
  log(`API URL: ${API_URL}`);
  log(`Test wallet address: ${TEST_WALLET_ADDRESS}`);
  log(`Generated device fingerprint: ${deviceFingerprint}`);
  
  let accessToken = null;
  let refreshToken = null;
  
  try {
    // Step 1: Test backend connectivity
    log('Step 1: Testing backend connectivity', 'step');
    try {
      const healthResponse = await axios.get(`${API_URL}/health`);
      log(`Backend health check: ${healthResponse.status === 200 ? 'OK' : 'Failed'}`, 
        healthResponse.status === 200 ? 'success' : 'error');
    } catch (error) {
      log(`Backend is not accessible: ${error.message}`, 'error');
      log('Please make sure the backend server is running on the correct port', 'error');
      process.exit(1);
    }
    
    // Step 2: Request a challenge
    log('Step 2: Requesting authentication challenge', 'step');
    let challenge;
    try {
      const challengeResponse = await axios.post(`${API_URL}/auth/wallet/connect`, {
        address: TEST_WALLET_ADDRESS
      });
      
      challenge = challengeResponse.data.challenge;
      log('Received challenge:', 'success');
      log(challenge);
    } catch (error) {
      log(`Failed to get challenge: ${error.message}`, 'error');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'error');
      }
      process.exit(1);
    }
    
    // Step 3: Sign the challenge
    log('Step 3: Signing the challenge', 'step');
    let signature;
    try {
      signature = await TEST_WALLET.signMessage(challenge);
      log(`Generated signature: ${signature.substring(0, 20)}...`, 'success');
    } catch (error) {
      log(`Failed to sign challenge: ${error.message}`, 'error');
      process.exit(1);
    }
    
    // Step 4: Authenticate with the signature
    log('Step 4: Authenticating with signature', 'step');
    try {
      // Make sure the request body is formatted correctly - the key issue may be JSON formatting
      const authRequestBody = JSON.stringify({
        address: TEST_WALLET_ADDRESS,
        walletAddress: TEST_WALLET_ADDRESS,
        signature: signature,
        message: challenge
      });
      
      log(`Request body: ${authRequestBody}`, 'info');
      
      const authResponse = await axios.post(
        `${API_URL}/auth/wallet/authenticate`, 
        JSON.parse(authRequestBody),
        {
          headers: {
            'X-Device-Fingerprint': deviceFingerprint,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      accessToken = authResponse.data.accessToken;
      refreshToken = authResponse.data.refreshToken;
      
      if (accessToken && refreshToken) {
        log('Authentication successful!', 'success');
        log(`Received tokens:
  - Access token: ${accessToken.substring(0, 20)}...
  - Refresh token: ${refreshToken.substring(0, 20)}...`);
        
        // Save tokens to files for easier debugging
        try {
          fs.writeFileSync('access_token.txt', accessToken);
          fs.writeFileSync('refresh_token.txt', refreshToken);
          log('Tokens saved to access_token.txt and refresh_token.txt', 'info');
        } catch (error) {
          log(`Error saving tokens to files: ${error.message}`, 'warn');
        }
      } else {
        log('Authentication successful but tokens are missing', 'error');
        process.exit(1);
      }
    } catch (error) {
      log(`Authentication failed: ${error.message}`, 'error');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'error');
      }
      process.exit(1);
    }
    
    // Step 5: Test access to a protected endpoint
    log('Step 5: Testing access to protected endpoint', 'step');
    try {
      const meResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Device-Fingerprint': deviceFingerprint
        }
      });
      
      log(`Successfully accessed protected endpoint: ${JSON.stringify(meResponse.data)}`, 'success');
    } catch (error) {
      log(`Failed to access protected endpoint: ${error.message}`, 'error');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
    
    // Step 6: Test token refresh
    log('Step 6: Testing token refresh', 'step');
    try {
      const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken
      });
      
      const newAccessToken = refreshResponse.data.accessToken;
      const newRefreshToken = refreshResponse.data.refreshToken;
      
      if (newAccessToken && newRefreshToken) {
        log('Token refresh successful!', 'success');
        log(`Received new tokens:
  - New access token: ${newAccessToken.substring(0, 20)}...
  - New refresh token: ${newRefreshToken.substring(0, 20)}...`);
        
        // Update tokens
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;
      } else {
        log('Token refresh successful but new tokens are missing', 'warn');
      }
    } catch (error) {
      log(`Token refresh failed: ${error.message}`, 'warn');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'warn');
      }
    }
    
    // Step 7: Test accessing protected endpoint with new token
    log('Step 7: Testing access with refreshed token', 'step');
    try {
      const profileResponse = await axios.get(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Device-Fingerprint': deviceFingerprint
        }
      });
      
      log(`Successfully accessed profile with refreshed token: ${JSON.stringify(profileResponse.data)}`, 'success');
    } catch (error) {
      log(`Failed to access profile with refreshed token: ${error.message}`, 'warn');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'warn');
      }
    }

    // Step 8: Verify device information is stored correctly
    log('Step 8: Verifying device information', 'step');
    try {
      const devicesResponse = await axios.get(`${API_URL}/user/devices`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Device-Fingerprint': deviceFingerprint
        }
      });
      
      log(`Successfully retrieved device information: Found ${devicesResponse.data.length} devices`, 'success');
    } catch (error) {
      log(`Failed to retrieve device information: ${error.message}`, 'warn');
      if (error.response) {
        log(`Server response: ${JSON.stringify(error.response.data)}`, 'warn');
      }
    }
    
    // Final result
    log('Authentication test completed successfully!', 'success');
    
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the test
runAuthTest().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
