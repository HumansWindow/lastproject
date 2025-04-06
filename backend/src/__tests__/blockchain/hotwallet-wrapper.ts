/**
 * This is a TypeScript wrapper for the hotwallet implementation to make testing easier
 */

// Use path.resolve instead of import.meta.url
import { createRequire } from 'module';
import * as path from 'path';
const customRequire = createRequire(path.resolve(__dirname)); // Renamed from 'require' to 'customRequire'

// Use a function to import the modules dynamically
export async function getHotWalletModules() {
  try {
    const HotWallet = (await import('../../blockchain/hotwallet/index.js')).default;
    const ChainHandlers = (await import('../../blockchain/hotwallet/handlers/ChainHandlers.js')).default;
    const WalletManager = (await import('../../blockchain/hotwallet/WalletManager.js')).default;
    const BalanceService = (await import('../../blockchain/hotwallet/services/BalanceService.js')).default;
    const { encrypt, decrypt, wipeMemory, generateKey } = await import('../../blockchain/hotwallet/utils/encryption.js');
    
    return {
      HotWallet,
      ChainHandlers,
      WalletManager,
      BalanceService,
      encrypt,
      decrypt, 
      wipeMemory,
      generateKey
    };
  } catch (error) {
    console.error('Error loading hotwallet modules:', error);
    throw error;
  }
}

// Re-export for compatibility
export { default as HotWallet } from '../../blockchain/hotwallet/index.js';
export { default as ChainHandlers } from '../../blockchain/hotwallet/handlers/ChainHandlers.js';
export { default as WalletManager } from '../../blockchain/hotwallet/WalletManager.js';
export { default as BalanceService } from '../../blockchain/hotwallet/services/BalanceService.js';
export {
  encrypt,
  decrypt,
  wipeMemory,
  generateKey,
} from '../../blockchain/hotwallet/utils/encryption.js';
