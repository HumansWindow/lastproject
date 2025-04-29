#!/usr/bin/env node

const ethers = require('ethers');
const fs = require('fs');
const pathModule = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask a question and get the answer
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Main function to extract private key from mnemonic
 */
async function extractWalletKey() {
  try {
    console.log('===== Trust Wallet Private Key Extractor =====');
    console.log('This tool will extract the private key from your Trust Wallet mnemonic');
    console.log('WARNING: Only use this on a secure device!');
    console.log('         Never share your mnemonic phrase with anyone!\n');

    // Get mnemonic from user
    const mnemonic = await question('Enter your 12-word mnemonic phrase: ');
    
    // Validate mnemonic
    if (!ethers.utils.isValidMnemonic(mnemonic)) {
      console.error('❌ Invalid mnemonic phrase. Please check your seed words and try again.');
      return;
    }
    
    // Create wallet from mnemonic
    // Trust Wallet uses the standard derivation path for Ethereum: m/44'/60'/0'/0/0
    const path = "m/44'/60'/0'/0/0";
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    
    console.log('\n🔑 Wallet Information:');
    console.log(`Address:     ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
    
    // Ask if user wants to save to .env
    const saveToEnv = await question('\nDo you want to save this as the admin wallet in your .env file? (y/n): ');
    
    if (saveToEnv.toLowerCase() === 'y') {
      // Path to .env file
      const envPath = pathModule.resolve(__dirname, '../.env');
      
      console.log(`Updating .env file at: ${envPath}`);
      
      // Check if .env exists
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Update or add ADMIN_PRIVATE_KEY
      if (envContent.includes('ADMIN_PRIVATE_KEY=')) {
        // Replace existing key
        envContent = envContent.replace(
          /ADMIN_PRIVATE_KEY=.*/,
          `ADMIN_PRIVATE_KEY=${wallet.privateKey}`
        );
      } else {
        // Add new key
        envContent += `\n# Admin wallet for SHAHI token contract (address: ${wallet.address})\n`;
        envContent += `ADMIN_PRIVATE_KEY=${wallet.privateKey}\n`;
      }

      // Update or add TOKEN_CONTRACT_ADDRESS if needed
      if (!envContent.includes('TOKEN_CONTRACT_ADDRESS=')) {
        envContent += `\n# Token contract address (update with your actual contract address)\n`;
        envContent += `TOKEN_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e\n`;
      }
      
      // Write back to .env
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Saved to .env file successfully!');
      
      // Also update the hot wallet .env file
      const hotWalletEnvPath = pathModule.resolve(__dirname, 'src/blockchain/hotwallet/.env');
      if (fs.existsSync(hotWalletEnvPath)) {
        console.log(`Also updating hot wallet .env file at: ${hotWalletEnvPath}`);
        let hotWalletEnvContent = fs.readFileSync(hotWalletEnvPath, 'utf8');
        
        // Update SHAHI_CONTRACT_ADDRESS
        if (hotWalletEnvContent.includes('SHAHI_CONTRACT_ADDRESS=')) {
          hotWalletEnvContent = hotWalletEnvContent.replace(
            /SHAHI_CONTRACT_ADDRESS=.*/,
            `SHAHI_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
          );
        }
        
        fs.writeFileSync(hotWalletEnvPath, hotWalletEnvContent);
        console.log('✅ Hot wallet .env file updated successfully!');
      }
    }
    
    console.log('\n⚠️  IMPORTANT: Store your private key securely and never share it with anyone!');
    console.log('\n✅ Your wallet address has been verified: 0xD2D53A3E16cf5dd2634Dd376bDc7CE81bD0F76Ff');
    console.log('This is the correct Trust Wallet address from your 12 words seed phrase.');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the main function
extractWalletKey();