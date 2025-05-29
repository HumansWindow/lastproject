/**
 * Wallet Service Index
 * 
 * Main entry point for wallet functionality
 */
import { walletService } from "./walletService";
import extendedWalletService, { ExtendedWalletService } from "./walletExtensions";
import { WalletSelector } from "./walletSelector";
import { 
  BlockchainType, 
  WalletConnectionResult, 
  WalletInfo, 
  WalletProviderType,
  WalletEvent,
} from "./core/walletBase";

// Create a singleton instance of the wallet selector
const walletSelectorInstance = new WalletSelector();

// Use the extended wallet service with all needed methods
const walletServiceInstance = extendedWalletService;

export {
  walletService,
  walletSelectorInstance as walletSelector,
  BlockchainType,
  WalletProviderType,
  WalletEvent,
};

export type {
  WalletConnectionResult,
  WalletInfo,
  ExtendedWalletService
};

// Import and export AvailableWallet type from walletSelector
import type { AvailableWallet } from "./walletSelector";
export type { AvailableWallet };

// Export the extended wallet service as default
export default walletServiceInstance;
