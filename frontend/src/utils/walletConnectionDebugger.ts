/**
 * Wallet Connection Debugger
 * 
 * This utility helps diagnose wallet authentication connection issues by testing
 * various connection configurations and fixing common problems automatically.
 */

import axios from 'axios';
import apiConfig from "@/config/api.config";

export interface ConnectionTestResult {
  success: boolean;
  endpoint: string;
  error?: string;
  message: string;
  timestamp: number;
}

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

class WalletConnectionDebugger {
  private static instance: WalletConnectionDebugger;
  private debugLogs: string[] = [];
  private isMonitoring: boolean = false;
  private originalFetch: typeof fetch | null = null;
  private originalXhr: any = null;
  private knownGoodEndpoint: string | null = null;

  private constructor() {
    // Only access browser APIs if we're in a browser environment
    if (isBrowser) {
      // Store original implementations to restore later
      this.originalFetch = window.fetch;
      this.originalXhr = XMLHttpRequest.prototype.open;
      this.log('Wallet connection debugger initialized');
      
      // If there's a stored override, apply it
      const storedOverride = localStorage.getItem('api_url_override');
      if (storedOverride) {
        this.log(`Using stored API URL override: ${storedOverride}`);
        this.knownGoodEndpoint = storedOverride;
      }
    }
  }

  /**
   * Get the singleton instance of the wallet connection debugger
   */
  public static getInstance(): WalletConnectionDebugger {
    if (!WalletConnectionDebugger.instance) {
      WalletConnectionDebugger.instance = new WalletConnectionDebugger();
    }
    return WalletConnectionDebugger.instance;
  }

  /**
   * Log a message to the debug console
   */
  public log(message: string, isError: boolean = false): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${isError ? '❌ ERROR: ' : '✓ '}${message}`;
    
    this.debugLogs.push(logMessage);
    if (isBrowser) {
      console.log(`%c${logMessage}`, isError ? 'color: #ff3333' : 'color: #33cc33');
    }
    
    // Keep only the last 200 logs
    if (this.debugLogs.length > 200) {
      this.debugLogs.shift();
    }
    
    // Dispatch event for debug panel to capture
    if (isBrowser) {
      const event = new CustomEvent('wallet-auth:log', {
        detail: { message, isError, timestamp }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Start monitoring network requests for debugging
   */
  public startMonitoring(): void {
    if (!isBrowser) {
      this.log('Cannot start monitoring outside of a browser environment', true);
      return;
    }

    if (this.isMonitoring) {
      this.log('Already monitoring network requests');
      return;
    }

    this.log('Starting network request monitoring for wallet authentication');
    this.isMonitoring = true;

    // Override fetch to monitor requests
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes('/auth/wallet')) {
        this.log(`Fetch request to ${url}`);
      }
      
      try {
        const response = await this.originalFetch!(input, init);
        
        if (url.includes('/auth/wallet')) {
          if (!response.ok) {
            this.log(`Fetch error for ${url}: ${response.status} ${response.statusText}`, true);
          } else {
            this.log(`Fetch success for ${url}: ${response.status}`);
          }
        }
        
        return response;
      } catch (error: unknown) {
        if (url.includes('/auth/wallet')) {
          this.log(`Fetch exception for ${url}: ${error instanceof Error ? error.message : String(error)}`, true);
        }
        throw error;
      }
    };

    // Override XMLHttpRequest to monitor requests
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string, password?: string) {
      const urlString = url.toString();
      if (urlString.includes('/auth/wallet')) {
        WalletConnectionDebugger.getInstance().log(`XHR ${method} request to ${urlString}`);
        
        this.addEventListener('load', function() {
          if (this.status >= 200 && this.status < 300) {
            WalletConnectionDebugger.getInstance().log(`XHR success for ${urlString}: ${this.status}`);
          } else {
            WalletConnectionDebugger.getInstance().log(`XHR error for ${urlString}: ${this.status}`, true);
          }
        });
        
        this.addEventListener('error', function() {
          WalletConnectionDebugger.getInstance().log(`XHR network error for ${urlString}`, true);
        });
        
        this.addEventListener('abort', function() {
          WalletConnectionDebugger.getInstance().log(`XHR aborted for ${urlString}`);
        });
      }
      
      // Call the original method with all possible parameters
      return WalletConnectionDebugger.getInstance().originalXhr.call(this, method, url, async, username, password);
    };

    this.log('Network request monitoring started');
  }

  /**
   * Stop monitoring network requests
   */
  public stopMonitoring(): void {
    if (!isBrowser) {
      this.log('Cannot stop monitoring outside of a browser environment', true);
      return;
    }

    if (!this.isMonitoring) {
      this.log('Not currently monitoring network requests');
      return;
    }

    window.fetch = this.originalFetch!;
    XMLHttpRequest.prototype.open = this.originalXhr;
    this.isMonitoring = false;
    this.log('Network request monitoring stopped');
  }

  /**
   * Test connectivity to the backend
   */
  public async testBackendConnectivity(): Promise<ConnectionTestResult[]> {
    this.log('Testing backend connectivity...');
    
    const results: ConnectionTestResult[] = [];
    const timestamp = Date.now();
    
    // Try different protocol/port combinations
    const endpoints = [
      apiConfig.API_URL,
      apiConfig.API_URL.replace('http:', 'https:'),
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Different health endpoints to try
    const healthPaths = ['/health', '/api/health', '/status', '/api/status', ''];
    
    // Test each endpoint with different health paths
    for (const endpoint of endpoints) {
      // Remove any trailing slashes for consistency
      const baseEndpoint = endpoint.replace(/\/$/, '');
      
      let endpointSucceeded = false;
      
      for (const healthPath of healthPaths) {
        if (endpointSucceeded) continue; // Skip if we already had success with this endpoint
        
        try {
          const testUrl = `${baseEndpoint}${healthPath}`;
          this.log(`Testing connectivity to ${testUrl}...`);
          
          const response = await axios.get(testUrl, {
            timeout: 3000,
            validateStatus: () => true
          });
          
          if (response.status >= 200 && response.status < 500) {
            this.log(`✅ Successful connection to ${baseEndpoint} (${response.status})`);
            results.push({
              success: true,
              endpoint: baseEndpoint,
              message: `Connected successfully (${response.status})`,
              timestamp
            });
            endpointSucceeded = true;
            
            // Store as known good endpoint
            this.knownGoodEndpoint = baseEndpoint;
            break;
          } else {
            this.log(`❌ Connection to ${testUrl} failed with status ${response.status}`, true);
          }
        } catch (error: unknown) {
          this.log(`❌ Connection to ${baseEndpoint}${healthPath} failed: ${error instanceof Error ? error.message : String(error)}`, true);
        }
      }
      
      // If all health paths failed, report the failure for this endpoint
      if (!endpointSucceeded) {
        results.push({
          success: false,
          endpoint: baseEndpoint,
          error: 'All health endpoints unreachable',
          message: 'Failed to connect to any health endpoint',
          timestamp
        });
      }
    }
    
    // Also try testing wallet-specific endpoints if we have a good endpoint
    if (this.knownGoodEndpoint) {
      try {
        const walletTestUrl = `${this.knownGoodEndpoint}/auth/wallet/health`;
        const response = await axios.get(walletTestUrl, {
          timeout: 3000,
          validateStatus: () => true
        });
        
        if (response.status >= 200 && response.status < 300) {
          this.log(`✅ Wallet auth endpoint is accessible at ${walletTestUrl}`);
          results.push({
            success: true,
            endpoint: walletTestUrl,
            message: 'Wallet auth endpoint is accessible',
            timestamp
          });
        }
      } catch (error) {
        this.log(`Note: Wallet specific auth endpoints not found or not accessible`, false);
      }
    }
    
    return results;
  }

  /**
   * Fix common connectivity issues automatically
   */
  public async fixConnectivityIssues(): Promise<boolean> {
    this.log('Attempting to fix connectivity issues...');
    
    // Test connectivity first
    const results = await this.testBackendConnectivity();
    const anySuccess = results.some(r => r.success);
    
    if (anySuccess) {
      this.log('At least one endpoint is accessible, checking configuration...');
      
      // Find the first successful endpoint
      const workingEndpoint = results.find(r => r.success)?.endpoint;
      
      if (workingEndpoint && workingEndpoint !== apiConfig.API_URL) {
        this.log(`Found working endpoint: ${workingEndpoint}`);
        
        // Save the current API_URL for reference
        const currentApiUrl = apiConfig.API_URL;
        
        // Update the API_URL to use the working endpoint
        (apiConfig as any).API_URL = workingEndpoint;
        this.knownGoodEndpoint = workingEndpoint;
        
        // Update localStorage to remember this fix
        if (isBrowser) {
          localStorage.setItem('api_url_override', workingEndpoint);
        }
        
        this.log(`✨ API URL updated from ${currentApiUrl} to ${workingEndpoint}`);
        return true;
      } else if (workingEndpoint) {
        this.log(`Current API URL ${apiConfig.API_URL} is working correctly`);
        return true;
      }
    } else {
      this.log('No working endpoints found. Backend may be down or unreachable.', true);
      
      // Check if port is the issue by trying different port combinations
      const differentPorts = ['3000', '3001', '3002', '8000', '8080'];
      const urlParts = new URL(apiConfig.API_URL);
      
      for (const port of differentPorts) {
        urlParts.port = port;
        const testUrl = urlParts.toString();
        
        try {
          this.log(`Trying alternative port: ${testUrl}`);
          const response = await axios.get(`${testUrl}/health`, {
            timeout: 2000,
            validateStatus: () => true
          });
          
          if (response.status < 500) {
            this.log(`✅ Found working port: ${port}`);
            
            // Update API URL
            (apiConfig as any).API_URL = testUrl;
            this.knownGoodEndpoint = testUrl;
            
            // Store in localStorage
            if (isBrowser) {
              localStorage.setItem('api_url_override', testUrl);
            }
            
            this.log(`✨ API URL updated to use port ${port}: ${testUrl}`);
            return true;
          }
        } catch (error) {
          // Ignore connection errors for alternative ports
        }
      }
      
      return false;
    }
    
    this.log('No changes needed to fix connectivity');
    return false;
  }

  /**
   * Get the debug logs
   */
  public getLogs(): string[] {
    return [...this.debugLogs];
  }

  /**
   * Clear the debug logs
   */
  public clearLogs(): void {
    this.debugLogs = [];
    this.log('Debug logs cleared');
  }

  /**
   * Test wallet authentication process step by step
   */
  public async testWalletAuth(walletAddress: string): Promise<boolean> {
    if (!walletAddress) {
      this.log('No wallet address provided', true);
      return false;
    }
    
    this.log(`Testing wallet auth for address: ${walletAddress}`);
    
    try {
      // Use the known good endpoint if available, otherwise use the configured API URL
      const baseUrl = this.knownGoodEndpoint || apiConfig.API_URL;
      
      // First, check if server is available at all
      try {
        this.log(`Testing server availability at ${baseUrl}/health...`);
        await axios.get(`${baseUrl}/health`, { 
          timeout: 3000,
          validateStatus: () => true 
        });
      } catch (error) {
        this.log(`Server health check failed, trying alternative paths...`, true);
        // Try alternative endpoints and ports
        const alternativeEndpoints = [
          `http://localhost:3001/health`,
          `http://127.0.0.1:3001/health`,
          `${baseUrl.replace(':3000', ':3001')}/health`,
          `${baseUrl.replace(':3001', ':3000')}/health`
        ];
        
        let serverAvailable = false;
        
        for (const endpoint of alternativeEndpoints) {
          try {
            this.log(`Trying alternative endpoint: ${endpoint}`);
            const response = await axios.get(endpoint, {
              timeout: 3000,
              validateStatus: () => true
            });
            
            if (response.status < 500) {
              this.log(`✅ Server available at ${endpoint}`);
              serverAvailable = true;
              // Update the base URL to use the working endpoint
              const url = new URL(endpoint);
              const newBaseUrl = `${url.protocol}//${url.host}`;
              this.knownGoodEndpoint = newBaseUrl;
              
              // Cache this working URL
              if (isBrowser) {
                localStorage.setItem('api_url_override', newBaseUrl);
              }
              
              break;
            }
          } catch (e) {
            // Continue with next alternative
          }
        }
        
        if (!serverAvailable) {
          this.log(`❌ Server unavailable at all tested endpoints. Is the backend running?`, true);
          return false;
        }
      }
      
      // Now we have a working endpoint to test challenge
      const baseUrlToUse = this.knownGoodEndpoint || baseUrl;
      
      // 1. Test the challenge endpoint with retry logic
      const challengeEndpoint = `${baseUrlToUse}/auth/wallet/connect`;
      this.log(`Testing challenge endpoint: ${challengeEndpoint}`);
      
      // Try up to 3 times with different path formats
      const maxRetries = 3;
      let challengeResponse = null;
      let challengeError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          let endpoint = challengeEndpoint;
          
          // Try alternative paths on subsequent attempts
          if (attempt === 2) {
            endpoint = `${baseUrlToUse}/auth/wallet-connect`;
            this.log(`Retry #${attempt}: Trying alternative endpoint ${endpoint}`);
          } else if (attempt === 3) {
            endpoint = `${baseUrlToUse}/api/auth/wallet/connect`;
            this.log(`Retry #${attempt}: Trying alternative endpoint ${endpoint}`);
          }
          
          challengeResponse = await axios.post(
            endpoint,
            { address: walletAddress },
            { 
              timeout: 5000,
              validateStatus: () => true,
              // Add specific headers that might help
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          if (challengeResponse.status === 200) {
            break; // Success, exit retry loop
          } else {
            this.log(`Challenge endpoint returned status ${challengeResponse.status} on attempt ${attempt}`, true);
            
            // If the status indicates server error, wait before retry
            if (challengeResponse.status >= 500) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          challengeError = error;
          this.log(`Challenge request failed on attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`, true);
          
          // Wait before retry
          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt; // Increase wait time with each attempt
            this.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Check if any attempt succeeded
      if (!challengeResponse || challengeResponse.status !== 200) {
        this.log(`❌ All challenge requests failed after ${maxRetries} attempts`, true);
        
        // Try one last option - the wallet-login endpoint which might also work
        try {
          this.log(`Trying legacy wallet-login endpoint as fallback...`);
          const legacyResponse = await axios.post(
            `${baseUrlToUse}/auth/wallet-login`,
            { address: walletAddress },
            { 
              timeout: 5000,
              validateStatus: () => true,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          if (legacyResponse.status === 200 && legacyResponse.data) {
            this.log(`✅ Legacy wallet-login endpoint working, challenge available`);
            return true;
          } else {
            this.log(`❌ Legacy endpoint failed with status: ${legacyResponse.status}`, true);
          }
        } catch (error) {
          this.log(`❌ Legacy endpoint error: ${error instanceof Error ? error.message : String(error)}`, true);
        }
        
        // Suggest troubleshooting steps
        this.log(`--------- TROUBLESHOOTING HELP ---------`, true);
        this.log(`1. Check if backend server is running at ${baseUrlToUse}`, true);
        this.log(`2. Verify that /auth/wallet/connect endpoint is registered`, true);
        this.log(`3. Check CORS configuration on backend server`, true);
        this.log(`4. Examine backend logs for error messages`, true);
        this.log(`5. Try restarting both frontend and backend servers`, true);
        this.log(`---------------------------------------`, true);
        
        return false;
      }
      
      // If we reach here, we have a successful challenge response
      this.log(`Challenge response: ${JSON.stringify(challengeResponse.data)}`);
      
      if (!challengeResponse.data.challenge) {
        this.log('❌ No challenge returned from backend', true);
        return false;
      }
      
      this.log('✅ Challenge endpoint working correctly');
      return true;
      
      // Note: We don't actually try to sign the message or authenticate
      // as that would require wallet interaction
    } catch (error: unknown) {
      this.log(`❌ Error testing wallet auth: ${error instanceof Error ? error.message : String(error)}`, true);
      
      // Provide more context for common errors
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          this.log('Network error indicates the server is not reachable. Check if the backend is running and accessible.', true);
        } else if (error.message.includes('timeout')) {
          this.log('Request timeout suggests the server is running but not responding in time. Check backend for performance issues.', true);
        } else if (error.message.includes('CORS')) {
          this.log('CORS error detected. The backend needs to allow requests from your frontend origin.', true);
        }
      }
      
      return false;
    }
  }
  
  /**
   * Reset any stored overrides and restore default configuration
   */
  public resetConfiguration(): void {
    if (isBrowser) {
      localStorage.removeItem('api_url_override');
      this.knownGoodEndpoint = null;
      this.log('API URL configuration reset to default');
    }
  }
}

// Export a singleton instance
const walletConnectionDebugger = WalletConnectionDebugger.getInstance();
export default walletConnectionDebugger;

// Make it available on the window object for debugging
if (isBrowser) {
  (window as any).walletConnectionDebugger = walletConnectionDebugger;
}