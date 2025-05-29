// Custom globals for development and debugging purposes
interface Window {
  // Web3 wallet providers
  ethereum?: any;
  BinanceChain?: any;
  solana?: any;
  solflare?: any;

  // Trust Wallet specific helpers for authentication issues
  trustWalletFixer?: {
    fixAuthentication: () => Promise<void>;
    isReady: () => boolean;
  };

  // Debug utilities for wallet authentication
  walletAuthDebug?: {
    enabled: boolean;
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
    warn: (message: string, data?: any) => void;
    clear: () => void;
    getLogs: () => any[];
  };
}

// Empty export to ensure TypeScript treats this as a module
export {};
