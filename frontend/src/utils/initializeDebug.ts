/**
 * Unified Debugging Initializer
 * 
 * This file initializes all debugging tools in the application:
 * - General authentication debugging
 * - Wallet connection debugging
 * - API connectivity diagnostics
 */

import { AuthDebugger } from "./authDebugger";
import walletConnectionDebugger from "./walletConnectionDebugger";
import apiConfig from "@/config/api.config";

/**
 * Initialize all debugging tools
 * This can be imported in _app.tsx or other entry points
 */
export const initializeDebugging = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.log('🔧 Initializing debugging tools...');
    
    // Initialize auth debugger
    AuthDebugger.initConsoleCommands();
    
    // Make wallet connection debugger available globally
    (window as any).walletConnectionDebugger = walletConnectionDebugger;
    
    // Create global functions to toggle debuggers
    (window as any).toggleAuthDebugger = () => {
      const debuggerInstance = AuthDebugger.getInstance();
      if (debuggerInstance.isMonitoring()) {
        debuggerInstance.stopMonitoring();
        return 'Auth debugger disabled';
      } else {
        debuggerInstance.startMonitoring();
        return 'Auth debugger enabled';
      }
    };
    
    // Handle API URL overrides for wallet connectivity
    handleApiUrlOverrides();
    
    // Set up automatic debugging based on URL params or localStorage
    setupAutomaticDebugging();
  }
};

/**
 * Handle any API URL overrides stored in localStorage
 */
function handleApiUrlOverrides() {
  const storedApiUrl = localStorage.getItem('api_url_override');
  if (storedApiUrl) {
    console.log(`🔧 Using stored API URL override: ${storedApiUrl}`);
    
    // Clear any previous stored value to avoid compounding issues
    if (storedApiUrl.includes('/auth/wallet-debug-check')) {
      console.log('🔧 Detected invalid URL path in override. Fixing...');
      // Remove the invalid path segment and store the corrected URL
      const fixedUrl = storedApiUrl.replace(/\/auth\/wallet-debug-check.*$/, '');
      localStorage.setItem('api_url_override', fixedUrl);
      console.log(`🔧 Fixed API URL override: ${fixedUrl}`);
      
      // Update the apiConfig with the fixed URL
      (apiConfig as any).API_URL = fixedUrl;
    } else {
      // Use the stored URL as is
      (apiConfig as any).API_URL = storedApiUrl;
    }
    
    updateApiEndpoints();
  }
}

/**
 * Update all API endpoints with the new base URL
 */
function updateApiEndpoints() {
  // Extract the base URL (protocol + host + port)
  const baseUrlMatch = (apiConfig as any).API_URL.match(/^(https?:\/\/[^/]+)/);
  if (baseUrlMatch && baseUrlMatch[1]) {
    const baseUrl = baseUrlMatch[1];
    
    Object.keys(apiConfig.endpoints).forEach(category => {
      // Use a more accurate type casting approach
      const endpoints = apiConfig.endpoints as any;
      const categoryEndpoints = endpoints[category];
      
      if (categoryEndpoints) {
        Object.keys(categoryEndpoints).forEach(key => {
          // Only update string endpoints, not functions
          if (typeof categoryEndpoints[key] === 'string') {
            // Replace just the base URL portion (protocol, host, port)
            const currentEndpoint = categoryEndpoints[key];
            const endpointPath = currentEndpoint.replace(/^https?:\/\/[^/]+/, '');
            categoryEndpoints[key] = `${baseUrl}${endpointPath}`;
          }
        });
      }
    });
    
    console.log('🔧 API configuration updated with base URL:', baseUrl);
  } else {
    console.log('⚠️ Could not extract base URL from API_URL:', (apiConfig as any).API_URL);
  }
}

/**
 * Setup automatic debugging based on URL parameters or localStorage settings
 */
function setupAutomaticDebugging() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Enable wallet debugging only if explicitly requested with URL parameter
  if (urlParams.has('debug')) {
    console.log('🔍 Wallet Connection Debugger Available');
    console.log('Use window.walletConnectionDebugger.startMonitoring() to begin debugging');
    
    // Auto-start monitoring if explicitly requested
    if (urlParams.get('debug') === 'auto') {
      setTimeout(() => {
        walletConnectionDebugger.startMonitoring();
        
        // Also enable auth debugging if available
        const authDebugger = AuthDebugger.getInstance();
        authDebugger.startMonitoring();
        
        // Automatically test backend connectivity and fix issues
        walletConnectionDebugger.testBackendConnectivity().then(results => {
          if (!results.some(r => r.success)) {
            console.log('🔧 No working endpoints found, attempting automatic fix...');
            walletConnectionDebugger.fixConnectivityIssues();
          }
        });
      }, 1000);
    }
  }
  
  // Remove the localStorage auto-start setting to prevent future auto-debugging
  if (localStorage.getItem('auto_start_debug') === 'true') {
    localStorage.removeItem('auto_start_debug');
  }
}

// Export the wallet connection debugger as default for backward compatibility
export default walletConnectionDebugger;

// For backward compatibility, maintain the old function name
export const initializeAuthDebugging = initializeDebugging;
