// test-rpc-connectivity.js
// Script to test RPC endpoint connectivity
require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Alternate RPC URLs to try if the current ones fail
const alternateRPCs = {
  'ETH_MAINNET_RPC': [
    'https://ethereum.publicnode.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com'
  ],
  'ETH_GOERLI_RPC': [
    'https://rpc.sepolia.org',
    'https://eth-sepolia.public.blastapi.io',
    'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // Public key
  ],
  'POLYGON_MAINNET_RPC': [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon-mainnet.public.blastapi.io'
  ],
  'POLYGON_MUMBAI_RPC': [
    'https://rpc-amoy.polygon.technology',
    'https://polygon-amoy.blockpi.network/v1/rpc/public',
    'https://polygon-amoy.public.blastapi.io'
  ],
  'BSC_MAINNET_RPC': [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://rpc.ankr.com/bsc'
  ],
  'BSC_TESTNET_RPC': [
    'https://data-seed-prebsc-1-s2.binance.org:8545/',
    'https://data-seed-prebsc-2-s1.binance.org:8545/'
  ],
  'RSK_MAINNET_RPC': [
    'https://public-node.rsk.co',
    'https://rsk-mainnet.public.blastapi.io'
  ],
  'RSK_TESTNET_RPC': [
    'https://public-node.testnet.rsk.co',
    'https://testnet.rsk.dev'
  ]
};

// Helper to test an RPC endpoint
async function testRPC(name, url) {
  console.log(`Testing ${name}: ${url}`);
  
  try {
    const response = await axios.post(url, {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    }, {
      timeout: 5000, // 5 second timeout
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.result) {
      const blockNumber = parseInt(response.data.result, 16);
      console.log(`✅ ${name} is working. Current block: ${blockNumber}`);
      return { success: true, url };
    } else {
      console.log(`❌ ${name} responded but with invalid data`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.message}`);
    return { success: false };
  }
}

// Find a working RPC URL for each network
async function findWorkingRPC(name, currentUrl) {
  // First try the current URL
  const currentResult = await testRPC(name, currentUrl);
  if (currentResult.success) return currentResult.url;
  
  console.log(`Looking for alternative ${name} endpoints...`);
  
  // If current URL failed, try alternatives
  if (alternateRPCs[name]) {
    for (const altUrl of alternateRPCs[name]) {
      const result = await testRPC(name, altUrl);
      if (result.success) return result.url;
    }
  }
  
  console.log(`⚠️ Could not find a working RPC for ${name}`);
  return currentUrl; // Return original if no alternative works
}

// Update the .env file with working RPCs
async function updateEnvFile(updatedRPCs) {
  const envPath = path.join(__dirname, '.env');
  let envContent = await fs.readFile(envPath, 'utf8');
  
  for (const [name, url] of Object.entries(updatedRPCs)) {
    const regex = new RegExp(`${name}=.*`, 'g');
    envContent = envContent.replace(regex, `${name}=${url}`);
  }
  
  await fs.writeFile(envPath, envContent);
  console.log('\n✅ .env file updated with working RPC endpoints');
}

// Main function
async function main() {
  console.log('Starting RPC connectivity tests...\n');
  
  // Extract RPC endpoints from .env
  const rpcKeys = [
    'ETH_MAINNET_RPC', 'ETH_GOERLI_RPC',
    'POLYGON_MAINNET_RPC', 'POLYGON_MUMBAI_RPC',
    'BSC_MAINNET_RPC', 'BSC_TESTNET_RPC',
    'RSK_MAINNET_RPC', 'RSK_TESTNET_RPC'
  ];
  
  const currentRPCs = {};
  for (const key of rpcKeys) {
    currentRPCs[key] = process.env[key];
  }
  
  // Test each RPC and find working alternatives if needed
  const updatedRPCs = {};
  for (const [name, url] of Object.entries(currentRPCs)) {
    updatedRPCs[name] = await findWorkingRPC(name, url);
  }
  
  // Update the .env file
  await updateEnvFile(updatedRPCs);
  
  console.log('\nSummary of RPC endpoints:');
  for (const [name, url] of Object.entries(updatedRPCs)) {
    console.log(`${name}: ${url}`);
  }
  
  console.log('\nRPC connectivity testing completed!');
}

// Execute the main function
main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});