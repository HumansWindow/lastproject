#!/usr/bin/env node

/**
 * JWT Authentication Flow Test Script
 * 
 * This script tests the complete authentication flow:
 * 1. Login (either with email/password or wallet)
 * 2. Access protected resources with the access token
 * 3. Test token refresh flow
 * 
 * Usage: ./test-auth-flow.js [--wallet | --email] [--verbose]
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';
const TEST_WALLET = process.env.TEST_WALLET || '0x123456789abcdef0123456789abcdef012345678';
const VERBOSE = process.argv.includes('--verbose');

// Force development mode for testing
process.env.NODE_ENV = 'development';

// Choose auth method based on command line args
const USE_WALLET = process.argv.includes('--wallet');
const USE_EMAIL = process.argv.includes('--email') || !USE_WALLET; // Default to email if not specified

// Parse API URL to check server
const API_HOST = new URL(API_URL).hostname;
const API_PORT = new URL(API_URL).port || (API_URL.startsWith('https') ? 443 : 80);

// Store tokens
let accessToken = null;
let refreshToken = null;

// Utility for logging
function log(message, data = null) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data && VERBOSE) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Check if server is running before starting tests
function checkServerAvailable() {
  return new Promise((resolve) => {
    log(`Checking if server is available at ${API_HOST}:${API_PORT}...`);
    
    const req = http.request({
      method: 'HEAD',
      host: API_HOST,
      port: API_PORT,
      path: '/',
      timeout: 3000
    }, (res) => {
      log(`Server responded with status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      log(`Server connection error: ${err.message}`);
      log(`Make sure your backend server is running on ${API_HOST}:${API_PORT}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      log('Server connection timed out');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Utility to check and decode JWT token
function decodeToken(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format - not a JWT' };
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp && payload.exp < now;
    
    return { 
      valid: !isExpired,
      isExpired,
      payload,
      header: JSON.parse(Buffer.from(parts[0], 'base64').toString())
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Test login with email and password
async function testEmailLogin() {
  try {
    log(`Testing email login with ${TEST_EMAIL}`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      validateStatus: function (status) {
        return status < 500; // Accept all responses except 500+ errors for better error reporting
      }
    });
    
    if (response.status !== 200 && response.status !== 201) {
      log(`Login request failed with status ${response.status}`, response.data);
      return false;
    }
    
    if (response.data && response.data.accessToken) {
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      
      // Analyze the token
      const tokenInfo = decodeToken(accessToken);
      log(`Login successful! Token valid: ${tokenInfo.valid}`, tokenInfo);
      
      return true;
    } else {
      log('Login failed: No token received', response.data);
      return false;
    }
  } catch (error) {
    log(`Login error: ${error.message}`);
    if (error.response) {
      log('Response data:', error.response.data);
      log('Response status:', error.response.status);
      log('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Test login with wallet (simplified mock)
async function testWalletLogin() {
  try {
    log(`Testing wallet login with ${TEST_WALLET}`);
    
    // Step 1: Request challenge
    const challengeResponse = await axios.post(`${API_URL}/auth/wallet/connect`, {
      address: TEST_WALLET
    }, {
      validateStatus: function (status) {
        return status < 500; // Accept all responses except 500+ errors for better error reporting
      }
    });
    
    if (challengeResponse.status !== 200 && challengeResponse.status !== 201) {
      log(`Challenge request failed with status ${challengeResponse.status}`, challengeResponse.data);
      return false;
    }
    
    if (!challengeResponse.data || !challengeResponse.data.challenge) {
      log('Failed to get challenge', challengeResponse.data);
      return false;
    }
    
    const { challenge } = challengeResponse.data;
    log(`Received challenge: ${challenge.substring(0, 20)}...`);
    
    // Step 2: In a real scenario, you would sign this challenge with the wallet
    // For testing, we'll use a mock signature or a development bypass method
    const mockSignature = USE_WALLET && process.env.NODE_ENV === 'development' 
      ? 'valid_recovery:test_signature' 
      : 'recovery_signature_testonly';
    
    // Step 3: Submit signed challenge
    const loginResponse = await axios.post(`${API_URL}/auth/wallet/authenticate`, {
      walletAddress: TEST_WALLET,
      signature: mockSignature,
      message: challenge
    }, {
      validateStatus: function (status) {
        return status < 500; // Accept all responses except 500+ errors for better error reporting
      }
    });
    
    if (loginResponse.status !== 200 && loginResponse.status !== 201) {
      log(`Wallet login request failed with status ${loginResponse.status}`, loginResponse.data);
      return false;
    }
    
    if (loginResponse.data && loginResponse.data.accessToken) {
      accessToken = loginResponse.data.accessToken;
      refreshToken = loginResponse.data.refreshToken;
      
      // Display the full token for testing
      log(`Access Token: ${accessToken}`);
      log(`Refresh Token: ${refreshToken}`);
      
      // Analyze the token
      const tokenInfo = decodeToken(accessToken);
      log(`Wallet login successful! Token valid: ${tokenInfo.valid}`, tokenInfo);
      
      return true;
    } else {
      log('Wallet login failed: No token received', loginResponse.data);
      return false;
    }
  } catch (error) {
    log(`Wallet login error: ${error.message}`);
    if (error.response) {
      log('Response data:', error.response.data);
      log('Response status:', error.response.status);
      log('Response headers:', error.response.headers);
    }
    return false;
  }
}

// Test accessing protected resource
async function testProtectedResource() {
  try {
    if (!accessToken) {
      log('Cannot test protected resource: No access token available');
      return false;
    }
    
    log('Testing access to protected resource...');
    
    // Create axios instance with token
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}` // Check proper format!
      }
    });
    
    // Try multiple protected endpoints
    log('Trying /auth/me endpoint...');
    try {
      const response = await instance.get('/auth/me');
      log('Protected resource access successful with /auth/me', response.data);
      return true;
    } catch (error) {
      log(`Failed to access /auth/me: ${error.message}`);
      if (error.response) {
        log('Response data:', error.response.data);
        log('Response status:', error.response.status);
      }
      
      // Try alternative endpoint if first one fails
      log('Trying /users/profile endpoint...');
      try {
        const profileResponse = await instance.get('/users/profile');
        log('Protected resource access successful with /users/profile', profileResponse.data);
        return true;
      } catch (profileError) {
        log(`Failed to access /users/profile: ${profileError.message}`);
        if (profileError.response) {
          log('Response data:', profileError.response.data);
          log('Response status:', profileError.response.status);
        }
      }
    }
    
    // If we get here, both endpoints failed
    log('All protected resource endpoints failed');
    return false;
  } catch (error) {
    log(`Protected resource access error: ${error.message}`);
    
    if (error.response) {
      log('Response data:', error.response.data);
      log('Response status:', error.response.status);
      
      // Check for 401 Unauthorized (token issues)
      if (error.response.status === 401) {
        log('AUTHENTICATION FAILED: Token was rejected');
        log('This indicates issues with your JWT configuration');
      }
    }
    return false;
  }
}

// Test token refresh
async function testTokenRefresh() {
  try {
    if (!refreshToken) {
      log('Cannot test token refresh: No refresh token available');
      return false;
    }
    
    log('Testing token refresh flow...');
    log(`Original access token: ${accessToken?.substring(0, 15)}...`);
    
    const response = await axios.post(`${API_URL}/auth/refresh`, { 
      refreshToken 
    });
    
    if (response.data && response.data.accessToken) {
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken; 
      
      // Compare tokens
      log(`New access token: ${newAccessToken.substring(0, 15)}...`);
      log(`Tokens are ${newAccessToken === accessToken ? 'identical' : 'different'}`);
      
      // Update tokens for subsequent tests
      accessToken = newAccessToken;
      refreshToken = newRefreshToken || refreshToken;
      
      // Analyze the token
      const tokenInfo = decodeToken(accessToken);
      log(`Token refresh successful! New token valid: ${tokenInfo.valid}`, tokenInfo);
      
      return true;
    } else {
      log('Token refresh failed: No new token received', response.data);
      return false;
    }
  } catch (error) {
    log(`Token refresh error: ${error.message}`);
    if (error.response) {
      log('Response data:', error.response.data);
      log('Response status:', error.response.status);
    }
    return false;
  }
}

// Test whole auth flow
async function testAuthFlow() {
  log('============ JWT AUTHENTICATION FLOW TEST ============');
  
  // Check server availability first
  const isServerAvailable = await checkServerAvailable();
  
  if (!isServerAvailable) {
    log('❌ Server is not available. Please start your backend server before running this test.');
    log(`Expected server at: ${API_URL}`);
    
    // Suggest how to start the server
    log('\nTry running the following command to start your backend:');
    log('cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend && npm run start:dev');
    
    return {
      login: false,
      accessProtectedResource: false,
      tokenRefresh: false
    };
  }
  
  // Record results
  const results = {
    login: false,
    accessProtectedResource: false,
    tokenRefresh: false
  };
  
  try {
    // Step 1: Login
    results.login = USE_WALLET 
      ? await testWalletLogin() 
      : await testEmailLogin();
      
    if (!results.login) {
      log('❌ Login test failed. Cannot proceed with further tests.');
      return results;
    }
    
    // Wait a moment before next request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Access protected resource
    results.accessProtectedResource = await testProtectedResource();
    
    // Wait a moment before next request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Refresh token
    results.tokenRefresh = await testTokenRefresh();
    
    // Try protected resource again with new token
    if (results.tokenRefresh) {
      log('Testing protected resource with refreshed token...');
      await testProtectedResource();
    }
    
    return results;
  } catch (error) {
    log(`Test flow error: ${error.message}`);
    return results;
  } finally {
    // Test summary
    log('============ TEST RESULTS SUMMARY ============');
    log(`Login: ${results.login ? '✅ PASSED' : '❌ FAILED'}`);
    log(`Access Protected Resource: ${results.accessProtectedResource ? '✅ PASSED' : '❌ FAILED'}`);
    log(`Token Refresh: ${results.tokenRefresh ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Output detailed diagnostics
    if (!results.login || !results.accessProtectedResource || !results.tokenRefresh) {
      log('\n============ DIAGNOSTIC INFORMATION ============');
      if (accessToken) {
        const tokenInfo = decodeToken(accessToken);
        log('Access Token Analysis:', tokenInfo);
      } else {
        log('No access token available to analyze');
      }
    }
  }
}

// Run the tests
testAuthFlow();
