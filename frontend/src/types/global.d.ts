// Add global type declarations
declare module '@walletconnect/web3-provider' {
  import { IProviderOptions } from '@walletconnect/types';
  
  class WalletConnectProvider {
    constructor(opts: IProviderOptions);
    enable(): Promise<string[]>;
    request(args: { method: string; params?: any[] }): Promise<any>;
    on(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
    disconnect(): Promise<void>;
  }
  
  export default WalletConnectProvider;
}

// You may need to add other declarations as needed

// Global type definitions
interface Window {
  // Auth debugger interface
  authDebugger?: {
    startMonitoring: () => string;
    stopMonitoring: () => string;
    isMonitoring: () => string;
    getLogs: () => string[];
    clearLogs: () => string;
    diagnoseWalletAuth: () => Promise<string>;
    resetAuthState: () => string;
    fixTrustWallet: () => Promise<string>;
  };
  
  // Error handling utilities
  extractErrorDetails?: (error: any) => {
    message: string;
    code?: string;
    status?: number;
    details?: Record<string, any>;
  };
  
  // Wallet providers
  ethereum?: any;
  BinanceChain?: any;
  
  // Wallet connection debugger
  walletConnectionDebugger?: any;
}
