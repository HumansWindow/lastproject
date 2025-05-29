/**
 * Wallet Provider
 * Central export for all wallet-related functionality
 */

// Re-export everything from walletService and walletSelector
export { default as WalletService } from './wallet/walletService';
export { WalletSelector } from './wallet/walletSelector';

// Import types and enums directly from walletBase
import { 
  WalletProviderType as WalletProviderTypeEnum,
  WalletConnectionResult,
  WalletInfo,
  WalletEvent,
  BlockchainType as BlockchainTypeEnum
} from './wallet/core/walletBase';

// Re-export types
export type { 
  WalletConnectionResult,
  WalletInfo
};

// Export the AvailableWallet interface from walletSelector instead of defining it here
export type { AvailableWallet } from './wallet/walletSelector';

// Re-export enums as values (not types)
export { WalletEvent };

// Export enums properly - avoiding the "cannot be used as a value" TypeScript error
export const WalletProviderType = WalletProviderTypeEnum;
export const BlockchainType = BlockchainTypeEnum;

// Import and create an instance of the WalletSelector
import WalletSelectorClass from './wallet/walletSelector';
export const walletSelector = new WalletSelectorClass();

// Export the wallet service as default
import walletService from './wallet/walletService';
export default walletService;