#!/usr/bin/env node

import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import HotWallet from './index.ts'; // Fixed import from .js to .ts
import bip39 from 'bip39';
import { generateKey } from './utils/encryption.ts';
import dotenv from 'dotenv';
import config from './config.js';

// Load environment variables from .env file
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask a question and get the answer
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper function to load all ES modules
async function loadESModules() {
  try {
    // Ensure we have the necessary configuration loaded
    if (!process.env.ETH_RPC_URL) {
      // Load environment variables from the current directory's .env file
      const envPath = path.join(__dirname, '.env');
      try {
        const envConfig = dotenv.config({ path: envPath });
        if (envConfig.error) {
          console.warn('Warning: Could not load .env file. Using default configuration.');
        }
      } catch (error) {
        console.warn('Warning: Error loading .env file:', error.message);
      }
    }

    // Setup complete configuration by combining environment variables and defaults
    const fullConfig = {
      ETH_RPC_URL: process.env.ETH_RPC_URL || config.ETH_RPC_URL,
      BNB_RPC_URL: process.env.BNB_RPC_URL || config.BNB_RPC_URL,
      SOL_RPC_URL: process.env.SOL_RPC_URL || config.SOL_RPC_URL,
      MATIC_RPC_URL: process.env.MATIC_RPC_URL || config.MATIC_RPC_URL,
      encryptPrivateKeys: process.env.ENCRYPT_PRIVATE_KEYS === 'true' || config.encryptPrivateKeys,
      encryptionKey: process.env.WALLET_ENCRYPTION_KEY || config.encryptionKey,
    };

    // Debug: Print configuration (without sensitive data)
    console.log('Loaded configuration:', {
      ETH_RPC_URL: fullConfig.ETH_RPC_URL,
      BNB_RPC_URL: fullConfig.BNB_RPC_URL,
      SOL_RPC_URL: fullConfig.SOL_RPC_URL,
      MATIC_RPC_URL: fullConfig.MATIC_RPC_URL,
      encryptPrivateKeys: fullConfig.encryptPrivateKeys,
      // Don't log the encryption key
    });

    // Initialize the HotWallet with the full config
    return { HotWallet, config: fullConfig };
  } catch (error) {
    console.error('Failed to load modules:', error);
    process.exit(1);
  }
}

// Print wallet info without showing the full private key
function printWalletInfo(wallet) {
  const { privateKey, ...safeInfo } = wallet;
  const maskedPrivateKey =
    privateKey.substring(0, 6) + '...' + privateKey.substring(privateKey.length - 4);
  console.log({
    ...safeInfo,
    privateKey: maskedPrivateKey,
  });
}

// Import wallet from mnemonic
async function importWallet(mnemonic, network) {
  try {
    const { HotWallet, config: fullConfig } = await loadESModules();
    const hotWallet = new HotWallet(fullConfig);

    const wallet = await hotWallet.importWallet(mnemonic, network);
    console.log(`\nSuccessfully imported ${network} wallet:`);
    printWalletInfo(wallet);
    return wallet;
  } catch (error) {
    console.error(`\nError importing wallet: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Generate wallet for network
async function generateWallet(network) {
  try {
    const { HotWallet, config: fullConfig } = await loadESModules();
    const hotWallet = new HotWallet(fullConfig);

    const wallet = await hotWallet.generateWallet(network);
    console.log(`\nGenerated new ${network} wallet:`);
    printWalletInfo(wallet);
    return wallet;
  } catch (error) {
    console.error(`\nError generating wallet: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Generate a new mnemonic phrase
function generateMnemonic() {
  const mnemonic = bip39.generateMnemonic();
  console.log('\nGenerated new mnemonic phrase:');
  console.log(mnemonic);
  return mnemonic;
}

// Check balance for an address
async function checkBalance(address, network) {
  try {
    const { HotWallet, config: fullConfig } = await loadESModules();
    const hotWallet = new HotWallet(fullConfig);

    const balance = await hotWallet.getBalance(address, network);
    console.log(`\nBalance for ${address} on ${network}:`);
    console.log(`${balance} ${network}`);
    return balance;
  } catch (error) {
    console.error(`\nError checking balance: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Get encryption key
function getKey() {
  try {
    const key = generateKey();
    console.log('\nGenerated new encryption key:');
    console.log(key);
    console.log('\nAdd this key to your .env file as WALLET_ENCRYPTION_KEY=your-key-here');
    return key;
  } catch (error) {
    console.error(`\nError generating key: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Main function
async function main() {
  const command = process.argv[2]?.toLowerCase();
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'import':
        console.log('\n=== Import Wallet from Mnemonic ===');
        console.log('Please enter your recovery phrase when prompted');
        console.log('Make sure no one can see your screen!');

        const mnemonic = args[0] || (await question('\nEnter your mnemonic phrase: '));
        const network =
          args[1]?.toUpperCase() || (await question('Enter network (ETH, BTC, SOL, BNB, MATIC): '));
        await importWallet(mnemonic, network);
        break;

      case 'generate':
        console.log('\n=== Generate New Wallet ===');
        const genNetwork =
          args[0]?.toUpperCase() || (await question('Enter network (ETH, BTC, SOL, BNB, MATIC): '));
        await generateWallet(genNetwork);
        break;

      case 'generate-mnemonic':
        console.log('\n=== Generate Mnemonic Phrase ===');
        generateMnemonic();
        break;

      case 'balance':
        console.log('\n=== Check Wallet Balance ===');
        const address = args[0] || (await question('Enter wallet address: '));
        const balNetwork =
          args[1]?.toUpperCase() || (await question('Enter network (ETH, BTC, SOL, BNB, MATIC): '));
        await checkBalance(address, balNetwork);
        break;

      case 'get-key':
        console.log('\n=== Generate Encryption Key ===');
        getKey();
        break;

      case 'help':
      default:
        console.log('\n=== Hot Wallet CLI Tool ===');
        console.log('Usage:');
        console.log(
          '  node cli-tools.mjs import [mnemonic] [network]   - Import wallet from mnemonic',
        );
        console.log('  node cli-tools.mjs generate [network]            - Generate new wallet');
        console.log(
          '  node cli-tools.mjs generate-mnemonic             - Generate new mnemonic phrase',
        );
        console.log('  node cli-tools.mjs balance [address] [network]   - Check wallet balance');
        console.log('  node cli-tools.mjs get-key                       - Generate encryption key');
        console.log('  node cli-tools.mjs help                          - Show this help message');
        break;
    }
  } catch (error) {
    console.error('\nAn error occurred:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();
