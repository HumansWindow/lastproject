const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

/**
 * Utility script to verify deployed contracts across multiple networks
 * 
 * Usage: node verify-contracts.js [network]
 * where network is optional: all, ethereum, polygon, bsc
 */

// Read the contract addresses file
const addressesFile = path.join(__dirname, 'contract-addresses.json');
const addresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));

// Get command line args
const args = process.argv.slice(2);
const targetNetwork = args[0] || 'all';

// Check for required API keys
const requiredKeys = {
  ethereum: process.env.ETHERSCAN_API_KEY,
  polygon: process.env.POLYGONSCAN_API_KEY,
  bsc: process.env.BSCSCAN_API_KEY
};

// Define verification tasks
const verificationTasks = [];

// Function to add verification tasks
function addVerificationTasks(network, contractAddresses) {
  Object.keys(contractAddresses).forEach(env => {
    if (env === 'deploymentDates') return;
    
    // Handle mainnet
    if (env === 'mainnet' && contractAddresses[env]) {
      const address = contractAddresses[env];
      if (address && address !== '') {
        const networkName = network === 'ethereum' ? 'mainnet' : network;
        verificationTasks.push({ network: networkName, address });
      }
    } 
    // Handle testnet
    else if (env === 'testnet') {
      if (typeof contractAddresses[env] === 'string') {
        // For networks with simple testnet structure
        const address = contractAddresses[env];
        if (address && address !== '') {
          const networkName = `${network}Testnet`;
          verificationTasks.push({ network: networkName, address });
        }
      } else {
        // For networks with named testnets (ethereum, polygon)
        Object.keys(contractAddresses[env]).forEach(testnet => {
          const address = contractAddresses[env][testnet];
          if (address && address !== '') {
            verificationTasks.push({ network: testnet, address });
          }
        });
      }
    }
  });
}

// Add tasks based on target network
if (targetNetwork === 'all' || targetNetwork === 'ethereum') {
  if (!requiredKeys.ethereum) {
    console.warn('⚠️ Warning: ETHERSCAN_API_KEY not found in .env file');
  } else {
    addVerificationTasks('ethereum', addresses.SHAHICoin.ethereum);
  }
}

if (targetNetwork === 'all' || targetNetwork === 'polygon') {
  if (!requiredKeys.polygon) {
    console.warn('⚠️ Warning: POLYGONSCAN_API_KEY not found in .env file');
  } else {
    addVerificationTasks('polygon', addresses.SHAHICoin.polygon);
  }
}

if (targetNetwork === 'all' || targetNetwork === 'bsc') {
  if (!requiredKeys.bsc) {
    console.warn('⚠️ Warning: BSCSCAN_API_KEY not found in .env file');
  } else {
    addVerificationTasks('bnbChain', addresses.SHAHICoin.bnbChain);
  }
}

// Execute verification tasks
console.log(`🔍 Starting contract verification for ${targetNetwork} networks...`);
console.log('=====================================================');

// Check if we have any tasks
if (verificationTasks.length === 0) {
  console.log('❌ No contracts to verify. Check if you have deployed contracts to the selected networks and if your API keys are set in .env');
  process.exit(0);
}

// Execute verification for each task
let successCount = 0;
let failCount = 0;

for (const task of verificationTasks) {
  console.log(`\nVerifying contract on ${task.network} at address ${task.address}...`);
  
  try {
    const command = `npx hardhat verify --network ${task.network} ${task.address}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Contract verified successfully on ${task.network}!`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to verify contract on ${task.network}`);
    failCount++;
  }
}

// Print summary
console.log('\n=====================================================');
console.log('VERIFICATION SUMMARY');
console.log('=====================================================');
console.log(`Total Tasks: ${verificationTasks.length}`);
console.log(`Successful: ${successCount}`);
console.log(`Failed: ${failCount}`);
console.log('=====================================================');