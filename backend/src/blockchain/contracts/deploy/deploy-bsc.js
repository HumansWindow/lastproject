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

  // BNB Chain Mainnet Chain ID: 56
  // BNB Chain Testnet Chain ID: 97
  const networkName = network.name; // Will be 'bsc' or 'bscTestnet'
  const chainId = network.config.chainId || (networkName === 'bsc' ? 56 : 97);

  // Deploy proxy contract
  const { address } = await deployProxy(initialSupply, adminWallet, chainId, networkName);
  
  console.log("⌛ Waiting for block confirmations...");
  await ethers.provider.waitForTransaction(address, 5); // Wait for 5 confirmations
  
  // Verify contract on BscScan (if API key is provided)
  if (process.env.BSCSCAN_API_KEY) {
    console.log("Verifying contract on BscScan...");
    try {
      // Get the implementation address (since we're using a proxy)
      const implAddress = await upgrades.erc1967.getImplementationAddress(address);
      
      await run("verify:verify", {
        address: implAddress,
        constructorArguments: []
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
  
  // Update the contract addresses file
  const environment = networkName === 'bsc' ? 'mainnet' : 'testnet';
  updateContractAddress('bnbChain', environment, '', address);
  
  console.log("==========================================");
  console.log(`🚀 SHAHI Coin successfully deployed to BNB Chain!`);
  console.log(`📜 Contract address: ${address}`);
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });