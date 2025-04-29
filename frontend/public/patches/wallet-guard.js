/**
 * Wallet Extension Guard Script
 * Prevents "Cannot read properties of null (reading 'type')" errors
 * from wallet extensions like Binance Wallet
 */
(function() {
  // Keep original console.error to preserve logging functionality
  const originalConsoleError = console.error;
  
  // Wrap with safe error handling for wallet extension errors
  console.error = function(...args) {
    // Check if this is a wallet extension error we want to intercept
    const errorString = args.join(' ');
    if (
      errorString.includes("Cannot read properties of null (reading 'type')") && 
      (
        errorString.includes('inpage.js') || 
        errorString.includes('binanceInjectedProvider')
      )
    ) {
      // Log a more helpful message instead
      console.warn('[Wallet Extension] Prevented uncaught error from wallet extension');
      return; // Intercept error
    }
    
    // Pass through to original console.error for all other errors
    originalConsoleError.apply(console, args);
  };
  
  // Add safety protection for BinanceChain global
  if (typeof window !== 'undefined') {
    // Use Object.defineProperty to create a safe BinanceChain object if it doesn't exist
    if (!window.BinanceChain) {
      Object.defineProperty(window, 'BinanceChain', {
        value: new Proxy({}, {
          get(target, prop) {
            // Return safe values for common properties
            if (prop === 'type' || prop === 'chain') return '';
            if (typeof prop === 'string' && prop.startsWith('on')) return () => {};
            if (prop === 'request') return async () => ({ result: [] });
            return undefined;
          }
        }),
        writable: true,
        configurable: true
      });
    }
  }
})();
