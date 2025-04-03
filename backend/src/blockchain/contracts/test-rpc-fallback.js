// test-rpc-fallback.js
// Script to test the RPC fallback mechanism
require('dotenv').config();
const axios = require('axios');
const { ethers } = require('ethers');

console.log('RPC Fallback Test Script');
console.log('This script simulates RPC failures to test the fallback mechanism');
console.log('===========================================================\n');

// Collection of RPC endpoints to test
const rpcUrls = {
  ethereum: [
    'https://bad-url-to-simulate-failure.com', // Will fail
    'https://ethereum.publicnode.com', // Should work
    'https://rpc.ankr.com/eth/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a', // Should work with your API key
  ],
  polygon: [
    'https://bad-url-for-polygon.com', // Will fail
    'https://polygon-rpc.com', // Should work
    'https://rpc.ankr.com/polygon/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a', // Should work with your API key
  ],
  bsc: [
    'https://bad-url-for-bsc.com', // Will fail
    'https://bsc-dataseed.binance.org', // Should work
    'https://rpc.ankr.com/bsc/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a', // Should work with your API key
  ]
};

// Create providers
const createProvider = (url) => {
  return new ethers.providers.JsonRpcProvider(url);
};

// Test a single provider
const testProvider = async (provider, networkName, index) => {
  console.log(`Testing ${networkName} RPC #${index + 1}: ${provider.connection.url}`);
  
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ ${networkName} RPC #${index + 1} successful - Block: ${blockNumber}`);
    return { success: true, blockNumber };
  } catch (error) {
    console.log(`❌ ${networkName} RPC #${index + 1} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Test fallback mechanism with manual provider switching
const testProviderFallback = async (networkName, urls) => {
  console.log(`\n🔄 Testing RPC fallback for ${networkName}...`);
  
  for (let i = 0; i < urls.length; i++) {
    const provider = createProvider(urls[i]);
    const result = await testProvider(provider, networkName, i);
    
    if (result.success) {
      console.log(`✅ Fallback successful for ${networkName} on attempt ${i + 1}`);
      return result;
    }
    
    console.log(`Trying next ${networkName} RPC endpoint...`);
  }
  
  console.log(`❌ All ${networkName} RPC endpoints failed`);
  return { success: false, error: 'All endpoints failed' };
};

// Create a provider with automatic fallback using ethers FallbackProvider
const createFallbackProvider = (networkName) => {
  const providers = rpcUrls[networkName].map((url, i) => {
    return {
      provider: createProvider(url),
      priority: i, // Lower number = higher priority
      stallTimeout: 2000, // Time in ms after which to consider the provider stalled
      weight: rpcUrls[networkName].length - i // Higher weight for more reliable providers
    };
  });
  
  return new ethers.providers.FallbackProvider(providers, 1); // Require only 1 provider to respond
};

// Test the automatic fallback provider
const testAutomaticFallback = async (networkName) => {
  console.log(`\n🔄 Testing automatic fallback for ${networkName}...`);
  
  try {
    const provider = createFallbackProvider(networkName);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ ${networkName} automatic fallback successful - Block: ${blockNumber}`);
    return { success: true, blockNumber };
  } catch (error) {
    console.log(`❌ ${networkName} automatic fallback failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Run tests
const runTests = async () => {
  console.log('Starting RPC fallback tests...\n');
  
  // Test manual fallback for each network
  for (const [networkName, urls] of Object.entries(rpcUrls)) {
    await testProviderFallback(networkName, urls);
  }
  
  console.log('\n==== Testing Automatic Fallback ====');
  
  // Test automatic fallback for each network
  for (const networkName of Object.keys(rpcUrls)) {
    await testAutomaticFallback(networkName);
  }
  
  console.log('\n✅ RPC fallback tests completed');
};

// Execute the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});