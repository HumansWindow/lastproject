import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * This script generates a new admin wallet for the SHAHI token contract
 * and updates the .env file with the private key
 */
async function generateAdminWallet() {
  console.log('Generating new admin wallet...');
  
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('🎉 New Admin Wallet Generated 🎉');
  console.log('----------------------------------');
  console.log(`Address:    ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log(`Mnemonic:   ${wallet.mnemonic.phrase}`);
  console.log('----------------------------------');
  console.log('\nIMPORTANT: Store these details securely and NEVER share your private key!');

  // Load current .env file
  const envPath = path.resolve(__dirname, '../../.env');
  console.log(`Updating ${envPath} with new wallet info...`);

  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if ADMIN_PRIVATE_KEY already exists
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

    // Write back to .env
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully!');
    console.log(`\n📝 Remember to fund this wallet with ETH to pay for gas when minting tokens.`);
  } catch (error) {
    console.error('❌ Failed to update .env file:', error);
  }
}

// Run the script
generateAdminWallet().catch(console.error);