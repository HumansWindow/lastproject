/**
 * Wallet Initialization Safety Layer
 * 
 * This module provides safety mechanisms to prevent errors when browser extensions
 * try to access wallet objects before they're ready.
 */

// Keep track of initialization status
let isWalletInitialized = false;
let walletInitPromise: Promise<void> | null = null;

/**
 * Initialize the wallet environment with safety guards
 * This prevents "Cannot read properties of null (reading 'type')" errors
 * that occur with wallet extensions like Binance Wallet and Trust Wallet
 */
export async function initializeWalletSafely(): Promise<void> {
  if (isWalletInitialized) {
    return Promise.resolve();
  }
  
  if (walletInitPromise) {
    return walletInitPromise;
  }

  walletInitPromise = new Promise<void>((resolve) => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      isWalletInitialized = true;
      resolve();
      return;
    }

    // Create safe proxies for wallet extension access
    safeguardWalletExtensions();

    // Give extensions time to inject themselves
    setTimeout(() => {
      isWalletInitialized = true;
      resolve();
    }, 800); // Increased timeout for wallet initialization
  });

  return walletInitPromise;
}

/**
 * Create safeguards for wallet extensions to prevent errors when they 
 * try to access global objects before they're ready
 */
function safeguardWalletExtensions(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Add a safety proxy for window.ethereum if it doesn't exist yet
  // This prevents errors from extensions trying to access properties on non-existent objects
  if (!window.ethereum) {
    // Create a proxy that returns undefined for any property access until real ethereum is injected
    const safeEthereum = new Proxy({}, {
      get: (target, prop) => {
        // Return the real ethereum properties once available
        if (window.ethereum) {
          return window.ethereum[prop];
        }
        // Return undefined instead of throwing error
        return undefined;
      }
    });

    // Use Object.defineProperty to handle changing ethereum object correctly
    Object.defineProperty(window, 'ethereum', {
      get: () => {
        // Once a real ethereum object is injected, return it
        if (window._realEthereum) {
          return window._realEthereum;
        }
        // Otherwise return the safe proxy
        return safeEthereum;
      },
      set: (value) => {
        // When an extension sets the ethereum object, store it safely
        window._realEthereum = value;
        return true;
      },
      configurable: true
    });
  }

  // Add similar safety for Binance Chain Wallet
  if (!window.BinanceChain) {
    const safeBinanceChain = new Proxy({}, {
      get: (target, prop) => {
        if (window.BinanceChain) {
          return window.BinanceChain[prop];
        }
        
        // For common methods, return safe defaults
        if (prop === 'request') {
          return async () => { 
            throw new Error('BinanceChain not initialized yet');
          };
        }
        
        // For event handlers, return no-op function
        if (typeof prop === 'string' && prop.startsWith('on')) {
          return () => {};
        }
        
        return undefined;
      }
    });

    Object.defineProperty(window, 'BinanceChain', {
      get: () => {
        if (window._realBinanceChain) {
          return window._realBinanceChain;
        }
        return safeBinanceChain;
      },
      set: (value) => {
        window._realBinanceChain = value;
        return true;
      },
      configurable: true
    });
  }

  // Add similar safety for other wallet objects like solana, etc.
  // ... 
}

/**
 * Call this method to check if wallet environment is ready
 */
export function isWalletEnvironmentReady(): boolean {
  return isWalletInitialized;
}

// Declare global types
declare global {
  interface Window {
    ethereum?: any;
    _realEthereum?: any;
    BinanceChain?: any;
    _realBinanceChain?: any;
    solana?: any;
    _realSolana?: any;
    ton?: any;
    _realTon?: any;
  }
}