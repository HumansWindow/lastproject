#!/usr/bin/env node
/**
 * Minimal Wallet Authentication Test
 * 
 * This script tests the wallet authentication endpoint with rate limiting mitigation.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_WALLET_ADDRESS = '0x14791697260E4c9A71f18484C9f997B308e59325'; 

// Delay between authentication attempts (to avoid rate limiting)
const DELAY_MS = 3000; // Increased to 3 seconds to avoid rate limiting

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a device fingerprint for testing
 */
function generateDeviceFingerprint() {
  return crypto.createHash('sha256')
    .update(`test-device-${Date.now()}-${Math.random()}`)
    .digest('hex');
}

/**
 * Get a challenge for the wallet to sign
 */
async function getChallenge(retry = 0) {
  console.log(`Requesting challenge from server (attempt ${retry + 1})...`);
  
  const deviceFingerprint = generateDeviceFingerprint();
  console.log(`Using device fingerprint: ${deviceFingerprint.substring(0, 16)}...`);
  
  try {
    const response = await fetch(`${API_URL}/auth/wallet/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint,
        'X-Test-Bypass': 'true' // Add test bypass header
      },
      body: JSON.stringify({
        address: TEST_WALLET_ADDRESS,
        isTest: true // Add isTest parameter to bypass rate limiting
      })
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { message: text };
    }
    
    if (!response.ok) {
      if (response.status === 400 && data.message && data.message.includes('Too many challenge requests')) {
        console.log('Rate limit hit. Waiting before retry...');
        if (retry < 3) {
          // Exponential backoff (3s, 6s, 12s)
          await sleep(DELAY_MS * Math.pow(2, retry));
          return getChallenge(retry + 1);
        }
      }
      throw new Error(`Failed to get challenge: ${response.status} ${JSON.stringify(data)}`);
    }
    
    console.log(`Received challenge: ${data.challenge}`);
    return { challenge: data.challenge, deviceFingerprint };
  } catch (error) {
    console.error(`Error getting challenge: ${error.message}`);
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
  console.log('Sending authentication request...');
  
  // Ensure we're sending both address and walletAddress for compatibility
  const payload = {
    address: TEST_WALLET_ADDRESS, 
    walletAddress: TEST_WALLET_ADDRESS,
    signature: signature,
    message: challenge
  };
  
  console.log(`Request payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(`${API_URL}/auth/wallet/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint,
        'X-Test-Bypass': 'true' // Add test bypass header
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { text };
      }
    }
    
    if (response.ok) {
      console.log('Authentication successful!');
      console.log(`Received tokens: accessToken: ${data.accessToken ? data.accessToken.substring(0, 15) + '...' : 'none'}`);
      return data;
    } else {
      console.error(`Authentication failed with status ${response.status}`);
      console.error('Error details:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error(`Network error during authentication: ${error.message}`);
    return null;
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Starting minimal wallet authentication test ===');
  
  try {
    // Step 1: Get challenge with retry logic for rate limits
    const { challenge, deviceFingerprint } = await getChallenge();
    
    // Step 2: Create mock signature
    console.log('Creating mock signature...');
    const signature = createMockSignature(challenge);
    console.log(`Created mock signature: ${signature.substring(0, 20)}...`);
    
    // Step 3: Wait a moment to avoid rate limits
    console.log('Waiting briefly before authentication...');
    await sleep(DELAY_MS);
    
    // Step 4: Authenticate
    const authResult = await authenticate(challenge, signature, deviceFingerprint);
    
    if (authResult) {
      console.log('=== Test completed successfully ===');
    } else {
      console.log('=== Test failed ===');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Test error: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runTest();