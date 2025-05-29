/**
 * Wallet Extension Guard Script
 * Prevents "Cannot read properties of null (reading 'type')" errors
 * from wallet extensions like Binance Wallet
 */
(function() {
  // Keep original console functions to preserve logging functionality
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Enhanced wallet authentication logging
  window.walletAuthDebug = {
    enabled: true,
    logs: [],
    add(type, message, data) {
      if (!this.enabled) return;
      const entry = { 
        timestamp: new Date().toISOString(), 
        type, 
        message, 
        data 
      };
      this.logs.push(entry);
      return entry;
    },
    error(message, data) {
      return this.add('error', message, data);
    },
    warn(message, data) {
      return this.add('warn', message, data);
    },
    info(message, data) {
      return this.add('info', message, data);
    },
    getLogs() {
      return this.logs;
    },
    clearLogs() {
      this.logs = [];
    },
    toggle(state) {
      this.enabled = state === undefined ? !this.enabled : !!state;
      return this.enabled;
    }
  };
  
  // Wrap with safe error handling for wallet extension errors
  console.error = function(...args) {
    // Check if this is a wallet extension error we want to intercept
    const errorString = args.join(' ');
    
    // Authentication-related errors should be logged with details
    if (
      errorString.includes("Authentication failed") || 
      errorString.includes("wallet") || 
      errorString.includes("Authentication details")
    ) {
      window.walletAuthDebug.error("Authentication error detected", { message: errorString, args });
    }
    
    if (
      errorString.includes("Cannot read properties of null (reading 'type')") && 
      (
        errorString.includes('inpage.js') || 
        errorString.includes('binanceInjectedProvider')
      )
    ) {
      // Log a more helpful message instead
      console.warn('[Wallet Extension] Prevented uncaught error from wallet extension');
      window.walletAuthDebug.warn("Prevented wallet extension error", { message: errorString });
      return; // Intercept error
    }
    
    // Pass through to original console.error for all other errors
    originalConsoleError.apply(console, args);
  };
  
  // Enhance console.warn for wallet authentication debugging
  console.warn = function(...args) {
    const warningString = args.join(' ');
    if (
      warningString.includes("Authentication failed") || 
      warningString.includes("wallet")
    ) {
      window.walletAuthDebug.warn("Authentication warning", { message: warningString, args });
    }
    
    // Pass through to original console.warn
    originalConsoleWarn.apply(console, args);
  };
  
  // Monitor authentication-related logs
  console.log = function(...args) {
    const logString = args.join(' ');
    if (
      logString.includes("Authentication") || 
      logString.includes("wallet") || 
      logString.includes("Wallet") || 
      logString.includes("authenticate")
    ) {
      window.walletAuthDebug.info("Authentication log", { message: logString, args });
    }
    
    // Pass through to original console.log
    originalConsoleLog.apply(console, args);
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
  
  // Add a utility to extract error messages from the response object
  window.extractErrorDetails = function(error) {
    if (!error) return { message: 'Unknown error (null)', status: null, data: null };
    
    try {
      return {
        message: error.response?.data?.message || error.message || String(error),
        status: error.response?.status,
        data: error.response?.data,
        error
      };
    } catch (e) {
      return { message: String(error), status: null, data: null };
    }
  };
  
  // Add a global method to diagnose authentication issues
  window.diagnoseAuthIssue = function() {
    const authDebug = window.walletAuthDebug || { logs: [] };
    
    // Extract recent authentication related logs
    const recentAuthLogs = authDebug.logs.slice(-30);
    
    // Return diagnostic information
    return {
      logs: recentAuthLogs,
      localStorage: {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        hasDeviceFingerprint: !!localStorage.getItem('deviceFingerprint')
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  };
})();
