#!/usr/bin/env node
/**
 * Trust Wallet Authentication Test
 * 
 * This script tests the wallet authentication endpoint specifically for Trust Wallet,
 * which requires the blockchain parameter to be set to "polygon".
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_WALLET_ADDRESS = '0x14791697260E4c9A71f18484C9f997B308e59325'; 
const BLOCKCHAIN_TYPE = 'polygon'; // Trust Wallet uses polygon network

// Delay between authentication attempts (to avoid rate limiting)
const DELAY_MS = 3000;

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
    .update(`trust-wallet-test-device-${Date.now()}-${Math.random()}`)
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
        'X-Test-Bypass': 'true',
        'X-Blockchain-Type': BLOCKCHAIN_TYPE // Add blockchain type header
      },
      body: JSON.stringify({
        address: TEST_WALLET_ADDRESS,
        isTest: true,
        blockchain: BLOCKCHAIN_TYPE // Add blockchain parameter for Trust Wallet
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
    console.error(`Full error details:`, error);
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
  console.log('Sending authentication request with Trust Wallet parameters...');
  
  // Ensure we're sending both address and walletAddress for compatibility
  const payload = {
    address: TEST_WALLET_ADDRESS, 
    walletAddress: TEST_WALLET_ADDRESS,
    signature: signature,
    message: challenge,
    blockchain: BLOCKCHAIN_TYPE // Add blockchain parameter for Trust Wallet
  };
  
  console.log(`Request payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(`${API_URL}/auth/wallet/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprint,
        'X-Test-Bypass': 'true',
        'X-Blockchain-Type': BLOCKCHAIN_TYPE // Add blockchain type header
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
      console.log('Trust Wallet authentication successful!');
      console.log(`Received tokens: accessToken: ${data.accessToken ? data.accessToken.substring(0, 15) + '...' : 'none'}`);
      return data;
    } else {
      console.error(`Trust Wallet authentication failed with status ${response.status}`);
      console.error('Error details:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error(`Network error during Trust Wallet authentication: ${error.message}`);
    return null;
  }
}

/**
 * Run the test for Trust Wallet authentication
 */
async function runTest() {
  console.log('=== Starting Trust Wallet authentication test ===');
  console.log(`Using blockchain type: ${BLOCKCHAIN_TYPE}`);
  
  try {
    // Step 1: Get challenge with blockchain parameter
    const { challenge, deviceFingerprint } = await getChallenge();
    
    // Step 2: Create mock signature
    console.log('Creating mock signature...');
    const signature = createMockSignature(challenge);
    console.log(`Created mock signature: ${signature.substring(0, 20)}...`);
    
    // Step 3: Wait a moment to avoid rate limits
    console.log('Waiting briefly before authentication...');
    await sleep(DELAY_MS);
    
    // Step 4: Authenticate with Trust Wallet specific parameters
    const authResult = await authenticate(challenge, signature, deviceFingerprint);
    
    if (authResult) {
      console.log('=== Trust Wallet authentication test completed successfully ===');
      process.exit(0);
    } else {
      console.log('=== Trust Wallet authentication test failed ===');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Trust Wallet test error: ${error.message}`);
    process.exit(1);
  }
}

// Add global error handler
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  console.error('Error Stack:', error.stack);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Error Stack:', error.stack);
  process.exit(1);
});

// Print node version
console.log(`Node.js version: ${process.version}`);
console.log('Starting Trust Wallet Authentication Test...');
console.log(`API URL: ${API_URL}`);
console.log(`Test wallet address: ${TEST_WALLET_ADDRESS}`);
console.log(`Blockchain type: ${BLOCKCHAIN_TYPE}`);

// Run the Trust Wallet test
runTest();
