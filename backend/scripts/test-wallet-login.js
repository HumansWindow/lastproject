#!/usr/bin/env node

/**
 * This script demonstrates how to use ethers.js to create a wallet signature
 * and authenticate with the backend using the wallet-login endpoint
 */

const { ethers } = require('ethers');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
const WALLET_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123'; // Replace with your test private key

async function main() {
  try {
    console.log('🔑 Creating test wallet signature...');
    
    // Create a new wallet instance from the private key
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY);
    const address = wallet.address;
    
    console.log(`📬 Using wallet address: ${address}`);
    
    // Create a message to sign
    const timestamp = Date.now();
    const message = `Sign in to AliveHuman at timestamp ${timestamp}`;
    
    // Sign the message
    const signature = await wallet.signMessage(message);
    
    console.log('✅ Message signed successfully');
    console.log(`📝 Message: ${message}`);
    console.log(`🖋️ Signature: ${signature}`);
    
    // Prepare curl command for manual testing
    const curlCommand = `
curl -X POST ${API_URL}/auth/wallet-login \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "${address}",
    "message": "${message}",
    "signature": "${signature}"
  }'
`;
    
    console.log('\n=== CURL COMMAND FOR TESTING ===');
    console.log(curlCommand);
    
    // Optional: Make the actual request using axios
    console.log('\n📤 Sending request to backend...');
    try {
      const response = await axios.post(`${API_URL}/auth/wallet-login`, {
        address,
        message,
        signature
      });
      
      console.log('✅ Authentication successful!');
      console.log('📦 Response:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ Authentication failed:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(error.response.data);
      } else {
        console.error(error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main().catch(console.error);
