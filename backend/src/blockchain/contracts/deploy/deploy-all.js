const { execSync } = require('child_process');
require('dotenv').config();

/**
 * Script to deploy SHAHI Coin to all configured networks
 * Usage:
 * - For testnets: node deploy/deploy-all.js test
 * - For mainnets: node deploy/deploy-all.js main
 */

// Check for environment argument
const args = process.argv.slice(2);
const deployEnv = args[0] || 'test';

if (deployEnv !== 'test' && deployEnv !== 'main') {
  console.error('Invalid environment. Use "test" for testnets or "main" for mainnets');
  process.exit(1);
}

// Check for required environment variables
if (!process.env.ADMIN_HOT_WALLET) {
  console.error('❌ Missing ADMIN_HOT_WALLET in .env file');
  process.exit(1);
}

if (!process.env.PRIVATE_KEY) {
  console.error('❌ Missing PRIVATE_KEY in .env file');
  process.exit(1);
}

// Define networks based on environment
const networks = deployEnv === 'test' 
  ? ['mumbai', 'goerli', 'bscTestnet', 'rsktestnet']
  : ['polygon', 'mainnet', 'bsc', 'rskmainnet'];

const networkScripts = {
  // Testnets
  'mumbai': 'deploy/deploy-polygon.js',
  'goerli': 'deploy/deploy-ethereum.js',
  'bscTestnet': 'deploy/deploy-bsc.js',
  'rsktestnet': 'deploy/deploy-rsk.js',
  // Mainnets
  'polygon': 'deploy/deploy-polygon.js',
  'mainnet': 'deploy/deploy-ethereum.js',
  'bsc': 'deploy/deploy-bsc.js',
  'rskmainnet': 'deploy/deploy-rsk.js'
};

// Create a mapping for display names
const networkDisplayNames = {
  'mumbai': 'Polygon Mumbai',
  'goerli': 'Ethereum Goerli',
  'bscTestnet': 'BNB Chain Testnet',
  'rsktestnet': 'Bitcoin (RSK) Testnet',
  'polygon': 'Polygon Mainnet',
  'mainnet': 'Ethereum Mainnet',
  'bsc': 'BNB Chain Mainnet',
  'rskmainnet': 'Bitcoin (RSK) Mainnet'
};

console.log(`🚀 Deploying SHAHI Coin to ${deployEnv === 'test' ? 'TESTNETS' : 'MAINNETS'}`);
console.log('==========================================');

// Track successful and failed deployments
const results = {
  success: [],
  failed: []
};

// Deploy to each network
for (const network of networks) {
  console.log(`\n🔄 Deploying to ${networkDisplayNames[network]}...`);
  
  try {
    // Run the deployment script for this network
    execSync(`npx hardhat run ${networkScripts[network]} --network ${network}`, { 
      stdio: 'inherit' 
    });
    
    results.success.push(network);
    console.log(`✅ Deployment to ${networkDisplayNames[network]} successful!`);
  } catch (error) {
    results.failed.push(network);
    console.error(`❌ Failed to deploy to ${networkDisplayNames[network]}`);
  }
}

// Summary
console.log('\n==========================================');
console.log('DEPLOYMENT SUMMARY');
console.log('==========================================');

if (results.success.length > 0) {
  console.log('✅ Successful deployments:');
  results.success.forEach(network => console.log(`  - ${networkDisplayNames[network]}`));
}

if (results.failed.length > 0) {
  console.log('❌ Failed deployments:');
  results.failed.forEach(network => console.log(`  - ${networkDisplayNames[network]}`));
}

console.log('\nDeployment addresses are saved in deploy/contract-addresses.json');