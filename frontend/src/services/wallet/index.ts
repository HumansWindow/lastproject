/**
 * Wallet Service Index
 * 
 * Main entry point for wallet functionality
 */
import WalletService from './wallet-service';
import WalletSelector, { AvailableWallet } from './wallet-selector';
import { 
  BlockchainType, 
  WalletConnectionResult, 
  WalletInfo, 
  WalletProviderType,
  WalletEvent,
} from './core/wallet-base';

// Create a singleton instance of the wallet selector
const walletSelector = new WalletSelector();

// Create combined wallet service with all the methods needed by components
const combinedWalletService = {
  WalletService,
  walletSelector,
  
  // Add methods used by contexts/components that expect them on walletService
  on: (event: WalletEvent, listener: (...args: any[]) => void) => walletSelector.on(event, listener),
  off: (event: WalletEvent, listener: (...args: any[]) => void) => walletSelector.off(event, listener),
  connect: (type: WalletProviderType) => walletSelector.connectWallet(type),
  disconnect: () => walletSelector.disconnectWallet(),
  isConnected: () => walletSelector.isWalletConnected(),
  getWalletInfo: () => walletSelector.getCurrentWallet(),
  switchNetwork: (chainId: string, providerType?: WalletProviderType) => walletSelector.switchNetwork(chainId, providerType),
  signMessage: (message: string, walletInfo?: WalletInfo) => walletSelector.signMessage(message, walletInfo),
  getChallenge: (address: string) => WalletService.connectWallet(address),
  authenticate: (
    walletInfo: WalletInfo, 
    signature: string, 
    challenge: string,
    email?: string,
    deviceFingerprint?: string
  ) => {
    // The underlying authenticateWallet doesn't use email and deviceFingerprint yet
    // In a future update, you might want to include these in the backend call
    return WalletService.authenticateWallet(walletInfo.address, signature, challenge);
  },
  logout: (refreshToken?: string) => WalletService.logout?.(refreshToken) || Promise.resolve(true),
  
  // Clear storage data method
  clearStorageData: () => WalletService.clearStorageData?.(),
  
  // Debug methods
  authenticator: {
    enableDebug: (enabled: boolean) => WalletService.setDebugEnabled?.(enabled),
  },
  setDebugEnabled: (enabled: boolean) => WalletService.setDebugEnabled?.(enabled),
  getDebugLogs: () => WalletService.getDebugLogs?.() || [],
  clearDebugLogs: () => WalletService.clearDebugLogs?.(),
};

export {
  WalletService,
  walletSelector,
  BlockchainType,
  WalletProviderType,
  WalletEvent,
};

export type {
  WalletConnectionResult,
  WalletInfo,
  AvailableWallet
};

// Export the combined wallet service as default
export default combinedWalletService;
