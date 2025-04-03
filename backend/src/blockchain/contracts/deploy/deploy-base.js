const { ethers, upgrades } = require("hardhat");
require('dotenv').config();

/**
 * Base deployment function used by all network-specific deployment scripts
 * @param {number} initialSupply - Initial supply of SHAHI tokens
 * @param {string} adminWallet - Admin hot wallet address
 * @param {number} chainId - The chain ID of the target network
 * @param {string} networkName - Name of the network being deployed to
 * @returns {Object} The deployed contract information
 */
async function deployProxy(initialSupply, adminWallet, chainId, networkName) {
  console.log(`\n🚀 Deploying SHAHI Coin to ${networkName} (Chain ID: ${chainId})`);
  console.log(`📊 Initial Supply: ${initialSupply} tokens`);
  console.log(`👮 Admin Hot Wallet: ${adminWallet}`);
  
  // Get the contract factory
  const SHAHICoin = await ethers.getContractFactory("SHAHICoinV1");
  
  // Deploy proxy with implementation
  console.log("📝 Deploying proxy contract...");
  const shahi = await upgrades.deployProxy(
    SHAHICoin,
    [initialSupply, adminWallet],
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  
  // Wait for deployment to complete
  await shahi.deployed();
  console.log(`✅ SHAHICoin deployed at: ${shahi.address}`);
  
  return {
    address: shahi.address,
    contract: shahi
  };
}

module.exports = {
  deployProxy
};