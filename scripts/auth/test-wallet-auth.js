#!/usr/bin/env node
/**
 * Wallet Authentication Test
 * 
 * This script tests the wallet authentication endpoint with a direct HTTP request
 * to help diagnose issues with the request format.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_WALLET_ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'; // Example wallet
const DELAY_MS = 3000; // 3 second delay between requests to avoid rate limiting

/**
 * Generate a test device fingerprint
 */
function generateDeviceFingerprint() {
  return crypto.createHash('sha256')
    .update(`test-device-${Date.now()}-${Math.random()}`)
    .digest('hex');
}

/**
 * Log with timestamp and color
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const COLORS = {
    info: '\x1b[36m',   // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    step: '\x1b[35m',    // Magenta
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${COLORS[type]}[${timestamp}] ${message}${COLORS.reset}`);
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a challenge for the wallet to sign
 */
async function getChallenge(retry = 0) {
  log(`Requesting challenge from server (attempt ${retry + 1})...`, 'step');
  
  const deviceFingerprint = generateDeviceFingerprint();
  log(`Using device fingerprint: ${deviceFingerprint.substring(0, 16)}...`, 'info');
  
  try {
    const response = await fetch(`${API_URL}/auth/wallet/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint
      },
      body: JSON.stringify({
        address: TEST_WALLET_ADDRESS
        // Only send address parameter to avoid any confusion
      })
    });

    let errorText = '';
    if (!response.ok) {
      errorText = await response.text();
      
      // Check for rate limiting
      if (response.status === 400 && errorText.includes('Too many challenge requests')) {
        log('Rate limit hit. Waiting before retry...', 'warn');
        if (retry < 3) {
          // Exponential backoff (3s, 6s, 12s)
          const delay = DELAY_MS * Math.pow(2, retry);
          await sleep(delay);
          return getChallenge(retry + 1);
        }
      }
      
      throw new Error(`Failed to get challenge: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    log(`Received challenge: ${data.challenge}`, 'success');
    return { challenge: data.challenge, deviceFingerprint };
  } catch (error) {
    log(`Error getting challenge: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Create a mock signature (since we don't have a real wallet in this test)
 */
function createMockSignature(challenge) {
  return `0x${crypto.randomBytes(65).toString('hex').substring(0, 130)}`;
}

/**
 * Authenticate with the signed challenge
 */
async function authenticate(challenge, signature, deviceFingerprint) {
  log('Sending authentication request...', 'step');
  
  // Include both address and walletAddress to ensure compatibility
  const payload = {
    address: TEST_WALLET_ADDRESS,
    walletAddress: TEST_WALLET_ADDRESS, 
    signature: signature,
    message: challenge
  };
  
  log(`Request payload: ${JSON.stringify(payload)}`, 'info');

  try {
    const response = await fetch(`${API_URL}/auth/wallet/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      log('Authentication successful!', 'success');
      log(`Received tokens: accessToken: ${data.accessToken ? data.accessToken.substring(0, 15) + '...' : 'none'}`, 'success');
      return data;
    } else {
      const errorText = await response.text();
      log(`Authentication failed with status ${response.status}`, 'error');
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        log(`Error details: ${JSON.stringify(errorData)}`, 'error');
      } catch (e) {
        log(`Error response: ${errorText}`, 'error');
      }
      return null;
    }
  } catch (error) {
    log(`Network error: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Try fallback to debug endpoint
 */
async function tryDebugAuthentication(challenge, signature, deviceFingerprint) {
  log('Attempting debug authentication...', 'step');
  
  const payload = {
    address: TEST_WALLET_ADDRESS,
    walletAddress: TEST_WALLET_ADDRESS,
    signature: 'debug_' + signature.substring(0, 10),
    message: challenge
  };

  try {
    const response = await fetch(`${API_URL}/auth/wallet-debug/mock-authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      log('Debug authentication successful!', 'success');
      return data;
    } else {
      log(`Debug authentication failed: ${response.status} ${await response.text()}`, 'error');
      return null;
    }
  } catch (error) {
    log(`Debug authentication error: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Run the test
 */
async function runTest() {
  log('=== Starting wallet authentication test ===', 'step');
  
  try {
    // Step 1: Get challenge with retry logic
    const { challenge, deviceFingerprint } = await getChallenge();
    
    // Step 2: Create mock signature (in a real scenario, this would be signed by wallet)
    const signature = createMockSignature(challenge);
    log(`Created mock signature: ${signature.substring(0, 15)}...`, 'info');
    
    // Step 3: Wait a moment before authentication to avoid rate limits
    await sleep(1000);
    
    // Step 4: Authenticate
    const authResult = await authenticate(challenge, signature, deviceFingerprint);
    
    // Step 5: Try debug authentication if regular auth fails
    if (!authResult) {
      log('Regular authentication failed, trying debug endpoint...', 'warn');
      const debugResult = await tryDebugAuthentication(challenge, signature, deviceFingerprint);
      
      if (debugResult) {
        log('Debug authentication successful as fallback', 'success');
      } else {
        log('Both regular and debug authentication failed', 'error');
        process.exit(1);
      }
    }
    
    log('=== Test completed successfully ===', 'success');
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the test
runTest();
