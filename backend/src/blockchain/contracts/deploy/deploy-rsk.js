const { deployProxy } = require('./deploy-base');
const { updateContractAddress } = require('./update-addresses');
const { run, upgrades } = require("hardhat");
require('dotenv').config();

async function main() {
  // Get environment variables
  const initialSupply = process.env.INITIAL_SUPPLY || 10000000; // Default: 10 million tokens
  const adminWallet = process.env.ADMIN_HOT_WALLET;

  if (!adminWallet) {
    throw new Error('ADMIN_HOT_WALLET environment variable not set');
  }

  // RSK Mainnet Chain ID: 30
  // RSK Testnet Chain ID: 31
  const networkName = network.name; // Will be 'rskmainnet' or 'rsktestnet'
  const chainId = network.config.chainId || (networkName === 'rskmainnet' ? 30 : 31);

  // Deploy proxy contract
  const { address } = await deployProxy(initialSupply, adminWallet, chainId, networkName);
  
  console.log("⌛ Waiting for block confirmations...");
  await ethers.provider.waitForTransaction(address, 5); // Wait for 5 confirmations
  
  // RSK doesn't have a well-established contract verification API like Etherscan,
  // but we can still log the verification details
  console.log(`\nContract deployed to RSK at address: ${address}`);
  console.log("To verify on RSK Explorer, submit the contract source code manually at:");
  console.log(networkName === 'rskmainnet' 
    ? `https://explorer.rsk.co/address/${address}` 
    : `https://explorer.testnet.rsk.co/address/${address}`);
  
  // Update the contract addresses file - we'll categorize RSK under Bitcoin
  const environment = networkName === 'rskmainnet' ? 'mainnet' : 'testnet';
  updateContractAddress('bitcoin', environment, '', address);
  
  console.log("\n==========================================");
  console.log(`🚀 SHAHI Coin successfully deployed to RSK (${networkName})!`);
  console.log(`📜 Contract address: ${address}`);
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });