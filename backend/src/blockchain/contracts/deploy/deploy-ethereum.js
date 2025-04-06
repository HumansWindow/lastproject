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

  // Ethereum Mainnet Chain ID: 1
  // Goerli Testnet Chain ID: 5
  const networkName = network.name; // Will be 'mainnet' or 'goerli'
  const chainId = network.config.chainId || (networkName === 'mainnet' ? 1 : 5);

  // Deploy proxy contract
  const { address } = await deployProxy(initialSupply, adminWallet, chainId, networkName);
  
  console.log("⌛ Waiting for block confirmations...");
  await ethers.provider.waitForTransaction(address, 5); // Wait for 5 confirmations
  
  // Verify contract on Etherscan (if API key is provided)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
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
  const environment = networkName === 'mainnet' ? 'mainnet' : 'testnet';
  const testnetName = networkName === 'goerli' ? 'goerli' : '';
  updateContractAddress('ethereum', environment, testnetName, address);
  
  console.log("==========================================");
  console.log(`🚀 SHAHI Coin successfully deployed to Ethereum ${networkName}!`);
  console.log(`📜 Contract address: ${address}`);
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });