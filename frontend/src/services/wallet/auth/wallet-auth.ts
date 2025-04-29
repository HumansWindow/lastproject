import axios from 'axios';
import { WalletInfo } from '../core/wallet-base';

export interface AuthChallenge {
  address: string;
  challenge: string;
  timestamp: number;
  isExistingUser?: boolean;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

export class WalletAuthenticator {
  private debugEnabled = false;
  private lastSuccessfulBaseUrl: string | null = null;
  private pendingAuthAttempts: Map<string, Promise<any>> = new Map(); // Track pending requests
  
  constructor(private apiBaseUrl: string) {
    // In development, clear any stored URLs to ensure we use the correct endpoint
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('wallet_auth_working_url');
      this.lastSuccessfulBaseUrl = null;
      this.debugLog('Development environment: cleared stored API URLs');
    }
    // Check if we have a stored known-good URL in localStorage
    else if (typeof window !== 'undefined' && window.localStorage) {
      const storedUrl = localStorage.getItem('wallet_auth_working_url');
      if (storedUrl) {
        this.lastSuccessfulBaseUrl = storedUrl;
        this.debugLog(`Using stored working URL: ${storedUrl}`);
      }
    }
  }
  
  /**
   * Enable or disable debug logging
   */
  enableDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
  }
  
  /**
   * Internal debug logging utility
   */
  private debugLog(message: string, isError: boolean = false): void {
    if (!this.debugEnabled) return;
    
    // Create a timestamp
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${isError ? '❌ ERROR: ' : '✓ '}${message}`;
    
    // Log to console
    if (isError) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // Dispatch a custom event for interested listeners
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('wallet-auth:log', {
        detail: { message: logMessage, isError, timestamp }
      });
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Test connectivity to ensure API server is reachable
   * This helps detect and fix connectivity issues early
   */
  private async testConnectivity(): Promise<string> {
    // Check if we already have a request in progress to prevent duplicate requests
    const cacheKey = 'connectivity-test';
    if (this.pendingAuthAttempts.has(cacheKey)) {
      this.debugLog('Using existing connectivity test request');
      return this.pendingAuthAttempts.get(cacheKey) as Promise<string>;
    }
    
    // Create a new connectivity test promise and store it
    const connectivityPromise = this.performConnectivityTest();
    this.pendingAuthAttempts.set(cacheKey, connectivityPromise);
    
    try {
      const result = await connectivityPromise;
      return result;
    } finally {
      // Clear the pending request when done
      this.pendingAuthAttempts.delete(cacheKey);
    }
  }
  
  private async performConnectivityTest(): Promise<string> {
    // If we have a known working URL, try it first
    if (this.lastSuccessfulBaseUrl) {
      try {
        const response = await axios.get(`${this.lastSuccessfulBaseUrl}/health`, { 
          timeout: 2000,
          validateStatus: (status) => status < 500 // Accept any non-500 response as "success"
        });
        
        this.debugLog(`Successfully connected to known good endpoint: ${this.lastSuccessfulBaseUrl}`);
        localStorage.setItem('wallet_auth_working_url', this.lastSuccessfulBaseUrl);
        return this.lastSuccessfulBaseUrl;
      } catch (err) {
        this.debugLog(`Known good endpoint failed: ${this.lastSuccessfulBaseUrl}`, true);
        // Continue with other tests if this fails
      }
    }
    
    // Try the configured API URL 
    try {
      const response = await axios.get(`${this.apiBaseUrl}/health`, { 
        timeout: 2000,
        validateStatus: (status) => status < 500 // Accept any non-500 response
      });
      
      this.debugLog(`Successfully connected to configured endpoint: ${this.apiBaseUrl}`);
      this.lastSuccessfulBaseUrl = this.apiBaseUrl;
      localStorage.setItem('wallet_auth_working_url', this.apiBaseUrl);
      return this.apiBaseUrl;
    } catch (err) {
      this.debugLog(`Configured endpoint failed: ${this.apiBaseUrl}`, true);
    }
    
    // Try alternative direct endpoints first (before trying different ports)
    const directEndpoints = [
      `${this.apiBaseUrl}/auth`,
      `${this.apiBaseUrl}/auth/wallet`,
      `${this.apiBaseUrl}/api`
    ];
    
    for (const endpoint of directEndpoints) {
      try {
        const response = await axios.get(endpoint, { 
          timeout: 2000,
          validateStatus: (status) => status < 500 // Accept any non-500 response
        });
        
        this.debugLog(`Found working direct endpoint: ${endpoint}`);
        this.lastSuccessfulBaseUrl = this.apiBaseUrl;
        localStorage.setItem('wallet_auth_working_url', this.apiBaseUrl);
        return this.apiBaseUrl;
      } catch (err) {
        // Continue trying other endpoints
      }
    }
    
    // Try with different ports (common backend ports)
    const url = new URL(this.apiBaseUrl);
    const originalPort = url.port;
    // Reordering to prioritize 3001 which is where our backend is running
    const alternativePorts = ['3001', '3000', '3002', '8000', '8080'];
    
    // Make sure we're not retesting the original port
    const filteredPorts = alternativePorts.filter(port => port !== originalPort);
    
    for (const port of filteredPorts) {
      url.port = port;
      const testUrl = url.toString();
      
      try {
        const response = await axios.get(`${testUrl}/health`, { 
          timeout: 2000,
          validateStatus: (status) => status < 500 // Accept any non-500 response
        });
        
        this.debugLog(`Found working endpoint with port ${port}: ${testUrl}`);
        
        // Save this working URL for future use
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('wallet_auth_working_url', testUrl);
        }
        
        this.lastSuccessfulBaseUrl = testUrl;
        return testUrl;
      } catch (err) {
        // Continue trying other ports
      }
    }
    
    // If all attempts fail, return the original URL
    this.debugLog(`All connection attempts failed, using default URL: ${this.apiBaseUrl}`, true);
    return this.apiBaseUrl;
  }
  
  /**
   * Get authentication challenge from the server
   * This is the first step in wallet authentication
   */
  async getAuthChallenge(address: string): Promise<AuthChallenge> {
    if (!address) {
      throw new Error('Wallet address is required for authentication');
    }
    
    // Normalize address to prevent case-sensitivity issues
    const normalizedAddress = address.toLowerCase();
    const cacheKey = `challenge:${normalizedAddress}`;
    
    // Check if we already have a request in progress to prevent duplicate requests
    if (this.pendingAuthAttempts.has(cacheKey)) {
      this.debugLog(`Using existing challenge request for address: ${normalizedAddress}`);
      return this.pendingAuthAttempts.get(cacheKey) as Promise<AuthChallenge>;
    }
    
    this.debugLog(`Getting auth challenge for address: ${normalizedAddress}`);
    
    // Create a new challenge request promise and store it
    const challengePromise = this.performGetAuthChallenge(normalizedAddress);
    this.pendingAuthAttempts.set(cacheKey, challengePromise);
    
    try {
      const result = await challengePromise;
      return result;
    } finally {
      // Clear the pending request when done
      this.pendingAuthAttempts.delete(cacheKey);
    }
  }
  
  private async performGetAuthChallenge(normalizedAddress: string): Promise<AuthChallenge> {
    // Number of retries and initial delay (milliseconds)
    let retryCount = 0;
    const maxRetries = 3; // Increased retries for challenge requests
    let delay = 800;
    
    // First test connectivity to find a working endpoint
    const baseUrl = await this.testConnectivity();
    
    while (retryCount <= maxRetries) {
      try {
        // Request a challenge from the backend
        this.debugLog(`Requesting challenge from ${baseUrl}/auth/wallet/connect`);
        
        const response = await axios.post(`${baseUrl}/auth/wallet/connect`, { 
          address: normalizedAddress
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          // Set a reasonable timeout
          timeout: 5000,
          // Allow CORS to prevent browser issues
          withCredentials: false
        });
        
        // Validate challenge response
        if (!response.data) {
          throw new Error('Empty response from server');
        }
        
        if (!response.data.challenge) {
          this.debugLog(`Invalid challenge response: ${JSON.stringify(response.data)}`, true);
          throw new Error('Invalid challenge response: missing challenge');
        }
        
        const challenge: AuthChallenge = {
          address: response.data.address || normalizedAddress,
          challenge: response.data.challenge,
          timestamp: response.data.timestamp || Date.now(),
          isExistingUser: !!response.data.isExistingUser
        };
        
        this.debugLog(`Received challenge: ${challenge.challenge.substring(0, 20)}...`);
        
        return challenge;
      } catch (err: any) {
        retryCount++;
        
        // Extract meaningful error information
        let errorMessage = 'Unknown error getting challenge';
        let statusCode = 0;
        
        if (err.response) {
          statusCode = err.response.status;
          errorMessage = err.response.data?.message || `Server error: ${statusCode}`;
          this.debugLog(`Challenge request error status: ${statusCode}, data: ${JSON.stringify(err.response.data || {})}`, true);
          
          // For 400-level errors, check if path might be different
          if (statusCode >= 400 && statusCode < 500 && retryCount === 1) {
            // Try alternative paths
            const alternativePaths = [
              '/auth/connect',
              '/auth/wallet-connect',
              '/auth/wallet/challenge',
              '/api/auth/wallet/connect'
            ];
            
            for (const path of alternativePaths) {
              try {
                this.debugLog(`Trying alternative path: ${baseUrl}${path}`);
                const altResponse = await axios.post(`${baseUrl}${path}`, { 
                  address: normalizedAddress
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  timeout: 5000,
                  withCredentials: false
                });
                
                if (altResponse.data && altResponse.data.challenge) {
                  const challenge: AuthChallenge = {
                    address: altResponse.data.address || normalizedAddress,
                    challenge: altResponse.data.challenge,
                    timestamp: altResponse.data.timestamp || Date.now(),
                    isExistingUser: !!altResponse.data.isExistingUser
                  };
                  
                  this.debugLog(`Success with alternative path! Received challenge: ${challenge.challenge.substring(0, 20)}...`);
                  return challenge;
                }
              } catch (altErr) {
                // Continue trying other paths
              }
            }
          }
        } else if (err.request) {
          // Request was made but no response received - likely a network error
          if (err.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout: server took too long to respond';
          } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused: server not reachable';
            
            // If connection refused, try a different port on next retry
            if (retryCount < maxRetries) {
              const url = new URL(baseUrl);
              url.port = (parseInt(url.port) + 1).toString();
              const newBaseUrl = url.toString();
              this.debugLog(`Connection refused. Trying alternative endpoint: ${newBaseUrl}`);
              
              try {
                const response = await axios.post(`${newBaseUrl}/auth/wallet/connect`, { 
                  address: normalizedAddress
                }, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  timeout: 5000,
                  withCredentials: false
                });
                
                if (response.data && response.data.challenge) {
                  // If this worked, save the new URL
                  if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem('wallet_auth_working_url', newBaseUrl);
                  }
                  
                  this.lastSuccessfulBaseUrl = newBaseUrl;
                  
                  const challenge: AuthChallenge = {
                    address: response.data.address || normalizedAddress,
                    challenge: response.data.challenge,
                    timestamp: response.data.timestamp || Date.now(),
                    isExistingUser: !!response.data.isExistingUser
                  };
                  
                  this.debugLog(`Success with alternative endpoint! Received challenge: ${challenge.challenge.substring(0, 20)}...`);
                  
                  return challenge;
                }
              } catch (altErr) {
                // Continue with normal retry logic if alternative also fails
                this.debugLog(`Alternative endpoint also failed`);
              }
            }
          } else {
            errorMessage = `Network error: ${err.code || 'no response received from server'}`;
          }
          this.debugLog('No response received from server for challenge request: ' + errorMessage, true);
        } else {
          // Error in setting up the request
          errorMessage = err.message || 'Error setting up challenge request';
          this.debugLog(`Challenge request setup error: ${errorMessage}`, true);
        }
        
        // Log the error
        this.debugLog(`Challenge request attempt ${retryCount} failed: ${errorMessage}`, true);
        
        // Always retry on network errors, but limit retries for other errors
        const shouldRetry = retryCount < maxRetries;
        
        if (!shouldRetry) {
          throw new Error(`Failed to get auth challenge: ${errorMessage}`);
        }
        
        // Wait with exponential backoff before retrying
        this.debugLog(`Retrying challenge request in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Increase delay for next retry
      }
    }
    
    // If we've exhausted all retries
    throw new Error('Failed to get auth challenge after maximum retries');
  }
  
  /**
   * Authenticate with wallet signature
   * This is the second step in wallet authentication after signing the challenge
   */
  async authenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    message: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    if (!walletInfo || !walletInfo.address) {
      throw new Error('Wallet information is required for authentication');
    }
    
    if (!signature) {
      this.debugLog("Empty signature provided", true);
      return {
        success: false,
        error: "Signature cannot be empty"
      };
    }
    
    // Create a unique key for this authentication attempt
    const normalizedAddress = walletInfo.address.toLowerCase();
    const cacheKey = `auth:${normalizedAddress}:${signature.substring(0, 10)}`;
    
    // Check if we already have a request in progress to prevent duplicate requests
    if (this.pendingAuthAttempts.has(cacheKey)) {
      this.debugLog(`Using existing authentication request for address: ${normalizedAddress}`);
      return this.pendingAuthAttempts.get(cacheKey) as Promise<AuthResult>;
    }
    
    this.debugLog(`Authenticating with signature: ${signature.substring(0, 20)}...`);
    this.debugLog(`Wallet Info: ${walletInfo.address}, Chain ID: ${walletInfo.chainId}`);
    
    // Create a new authentication request promise and store it
    const authPromise = this.performAuthenticate(walletInfo, signature, message, email, deviceFingerprint);
    this.pendingAuthAttempts.set(cacheKey, authPromise);
    
    try {
      const result = await authPromise;
      return result;
    } finally {
      // Clear the pending request when done
      this.pendingAuthAttempts.delete(cacheKey);
    }
  }
  
  private async performAuthenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    message: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    try {
      // Add a small delay to prevent race conditions with multiple requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Number of retries and initial delay (milliseconds)
      let retryCount = 0;
      const maxRetries = 3;
      let delay = 1000;
      
      // Normalize inputs to prevent common errors
      const normalizedAddress = walletInfo.address.toLowerCase();
      
      // Get a working base URL (will use cached result if available)
      const baseUrl = await this.testConnectivity();
      
      // Add a request timeout to prevent hanging requests
      const timeoutMs = 15000; // 15 seconds
      
      // Implementation with retry logic
      while (retryCount <= maxRetries) {
        try {
          // Create the request payload exactly matching the backend DTO requirements
          const payload = {
            address: normalizedAddress,
            signature: signature,
            message: message,
            ...(email && email.trim() ? { email: email.trim() } : {}) // Only include email if it exists and is not empty
          };
          
          const sanitizedPayloadLog = {
            address: payload.address,
            signatureLength: payload.signature.length,
            signaturePreview: `${payload.signature.substring(0, 10)}...`,
            messageLength: payload.message.length,
            messagePreview: `${payload.message.substring(0, 15)}...`,
            hasEmail: !!email
          };
          
          this.debugLog(`Sending authentication payload: ${JSON.stringify(sanitizedPayloadLog)}`);
          
          // Send the authentication request with proper headers
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Wallet-Chain-Id': walletInfo.chainId.toString()
          };
          
          // Only add fingerprint headers if they exist
          if (deviceFingerprint) {
            headers['X-Device-Fingerprint'] = deviceFingerprint;
            headers['X-Device-Id'] = deviceFingerprint;
          }
          
          this.debugLog(`Request to ${baseUrl}/auth/wallet/authenticate with headers: ${JSON.stringify(headers)}`);
          
          // Send the authentication request with timeout
          const response = await axios.post(
            `${baseUrl}/auth/wallet/authenticate`, 
            payload,
            { 
              headers,
              timeout: timeoutMs,
              withCredentials: false
            }
          );
          
          // Validate response structure
          if (!response.data) {
            throw new Error('Empty response from server');
          }
          
          this.debugLog('Authentication successful, status: ' + response.status);
          
          // Extract tokens from response with fallbacks for different response formats
          const accessToken = response.data.accessToken || response.data.token;
          const refreshToken = response.data.refreshToken;
          const userId = response.data.userId || (response.data.user && response.data.user.id);
          const isNewUser = !!response.data.isNewUser;
          
          if (!accessToken || !refreshToken) {
            this.debugLog('Missing tokens in successful response', true);
            
            // Try to extract tokens from different response formats
            const possibleTokenValues = [
              response.data.access_token,
              response.data.jwt,
              response.data.token,
              response.data.authToken,
              response.data.auth_token
            ];
            
            const possibleRefreshTokenValues = [
              response.data.refresh_token,
              response.data.refreshToken,
              response.data.refresh
            ];
            
            const extractedToken = possibleTokenValues.find(token => token);
            const extractedRefreshToken = possibleRefreshTokenValues.find(token => token);
            
            if (extractedToken && extractedRefreshToken) {
              return {
                success: true,
                token: extractedToken,
                refreshToken: extractedRefreshToken,
                userId: userId,
                isNewUser: isNewUser
              };
            }
            
            throw new Error('Authentication succeeded but no tokens were returned');
          }
          
          // Return success result
          return {
            success: true,
            token: accessToken,
            refreshToken: refreshToken,
            userId: userId,
            isNewUser: isNewUser
          };
        } catch (err: any) {
          retryCount++;
          
          // Extract meaningful error information
          let errorMessage = 'Unknown error during authentication';
          let statusCode = 0;
          let responseData = null;
          
          if (err.response) {
            statusCode = err.response.status;
            responseData = err.response.data;
            errorMessage = responseData?.message || responseData?.error || `Server error: ${statusCode}`;
            
            this.debugLog(`Response error status: ${statusCode}, data: ${JSON.stringify(responseData || {})}`, true);
            
            // For 400-level errors, check if path might be different
            if (statusCode >= 400 && statusCode < 500 && retryCount === 1) {
              // Try alternative paths
              const alternativePaths = [
                '/auth/authenticate',
                '/auth/wallet-authenticate',
                '/api/auth/wallet/authenticate'
              ];
              
              for (const path of alternativePaths) {
                try {
                  this.debugLog(`Trying alternative path: ${baseUrl}${path}`);
                  
                  const payload = {
                    address: normalizedAddress,
                    signature: signature,
                    message: message,
                    ...(email && email.trim() ? { email: email.trim() } : {})
                  };
                  
                  const authResponse = await axios.post(
                    `${baseUrl}${path}`, 
                    payload,
                    { 
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Wallet-Chain-Id': walletInfo.chainId.toString(),
                        ...(deviceFingerprint ? {
                          'X-Device-Fingerprint': deviceFingerprint,
                          'X-Device-Id': deviceFingerprint
                        } : {})
                      },
                      timeout: timeoutMs,
                      withCredentials: false
                    }
                  );
                  
                  if (authResponse.data) {
                    const accessToken = authResponse.data.accessToken || 
                      authResponse.data.token || 
                      authResponse.data.access_token || 
                      authResponse.data.jwt;
                      
                    const refreshToken = authResponse.data.refreshToken || 
                      authResponse.data.refresh_token ||
                      authResponse.data.refresh;
                      
                    const userId = authResponse.data.userId || 
                      (authResponse.data.user && authResponse.data.user.id);
                      
                    const isNewUser = !!authResponse.data.isNewUser;
                    
                    if (accessToken && refreshToken) {
                      this.debugLog(`Success with alternative path! Authentication successful.`);
                      return {
                        success: true,
                        token: accessToken,
                        refreshToken: refreshToken,
                        userId: userId,
                        isNewUser: isNewUser
                      };
                    }
                  }
                } catch (altErr) {
                  // Continue trying other paths
                }
              }
            }
          } else if (err.request) {
            // Request was made but no response received
            if (err.code === 'ECONNABORTED') {
              errorMessage = 'Request timeout. Server took too long to respond.';
            } else if (err.code === 'ECONNREFUSED') {
              errorMessage = 'Connection refused: server not reachable';
              
              // If connection refused, try a different port on next retry
              if (retryCount < maxRetries) {
                const url = new URL(baseUrl);
                url.port = (parseInt(url.port) + 1).toString();
                const newBaseUrl = url.toString();
                this.debugLog(`Connection refused. Trying alternative endpoint: ${newBaseUrl}`);
                
                try {
                  const authResponse = await axios.post(
                    `${newBaseUrl}/auth/wallet/authenticate`, 
                    {
                      address: normalizedAddress,
                      signature: signature,
                      message: message,
                      ...(email && email.trim() ? { email: email.trim() } : {})
                    },
                    { 
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Wallet-Chain-Id': walletInfo.chainId.toString(),
                        ...(deviceFingerprint ? {
                          'X-Device-Fingerprint': deviceFingerprint,
                          'X-Device-Id': deviceFingerprint
                        } : {})
                      },
                      timeout: timeoutMs,
                      withCredentials: false
                    }
                  );
                  
                  if (authResponse.data) {
                    // If this worked, save the new URL
                    if (typeof window !== 'undefined' && window.localStorage) {
                      localStorage.setItem('wallet_auth_working_url', newBaseUrl);
                    }
                    
                    this.lastSuccessfulBaseUrl = newBaseUrl;
                    
                    const accessToken = authResponse.data.accessToken || authResponse.data.token;
                    const refreshToken = authResponse.data.refreshToken;
                    const userId = authResponse.data.userId || (authResponse.data.user && authResponse.data.user.id);
                    const isNewUser = !!authResponse.data.isNewUser;
                    
                    this.debugLog(`Success with alternative endpoint! Authentication successful.`);
                    
                    return {
                      success: true,
                      token: accessToken,
                      refreshToken: refreshToken,
                      userId: userId,
                      isNewUser: isNewUser
                    };
                  }
                } catch (altErr) {
                  // Continue with normal retry logic if alternative also fails
                  this.debugLog(`Alternative endpoint also failed`);
                }
              }
            } else {
              errorMessage = 'No response received from server. Check your network connection.';
            }
            this.debugLog(`Network error: ${err.code || 'unknown network error'}`, true);
          } else {
            // Error in setting up the request
            errorMessage = err.message || 'Error setting up request';
            this.debugLog(`Request setup error: ${errorMessage}`, true);
          }
          
          // Log additional debug info about the error
          if (err.config) {
            this.debugLog(`Request URL: ${err.config.url}`, true);
            this.debugLog(`Request method: ${err.config.method}`, true);
            if (err.config.headers) {
              // Don't log sensitive headers
              const safeHeaders = { ...err.config.headers };
              delete safeHeaders.Authorization;
              this.debugLog(`Request headers: ${JSON.stringify(safeHeaders)}`, true);
            }
          }
          
          // Log the error
          this.debugLog(`Authentication attempt ${retryCount} failed: ${errorMessage}`, true);
          
          // Always retry on network errors, but limit retries for other errors
          const isServerError = statusCode >= 500 || !statusCode;
          const shouldRetry = retryCount <= maxRetries && isServerError;
          
          if (!shouldRetry) {
            // If not retrying, return a failure result with clear error
            return {
              success: false,
              error: errorMessage
            };
          }
          
          // For server errors (500+), add a longer delay before retrying
          if (statusCode >= 500) {
            delay = 2000 * retryCount; // Increase delay significantly for server errors
          }
          
          // Wait with exponential backoff before retrying
          this.debugLog(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
        }
      }
      
      // If we've exhausted all retries
      return {
        success: false,
        error: 'Authentication failed after maximum retries'
      };
    } catch (error: unknown) {
      // Handle any unexpected errors in the main try/catch block
      let errorMessage = 'Authentication failed with an unexpected error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = 'Unserializable error object';
        }
      }
      
      this.debugLog(`Unexpected authentication error: ${errorMessage}`, true);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string, deviceFingerprint?: string): Promise<AuthResult> {
    this.debugLog('Refreshing token...');
    
    // Get a working base URL
    const baseUrl = await this.testConnectivity();
    
    try {
      const response = await axios.post(`${baseUrl}/auth/refresh-token`, { 
        refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Device-Fingerprint': deviceFingerprint || 'unknown',
          'X-Device-Id': deviceFingerprint || 'unknown'
        },
        timeout: 5000,
        withCredentials: false
      });
      
      this.debugLog('Token refresh successful');
      
      return {
        success: true,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err?.response?.data?.message || 'Failed to refresh token';
      this.debugLog(`Token refresh error: ${errorMessage}`, true);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Logout and invalidate session
   */
  async logout(refreshToken: string): Promise<boolean> {
    this.debugLog('Logging out...');
    
    // Get a working base URL
    const baseUrl = await this.testConnectivity();
    
    try {
      await axios.post(`${baseUrl}/auth/logout`, { refreshToken }, {
        timeout: 5000,
        withCredentials: false
      });
      
      // Remove tokens from storage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('walletAddress');
      }
      
      this.debugLog('Logout successful');
      return true;
    } catch (error) {
      this.debugLog('Logout failed, but cleaning up local storage anyway', true);
      
      // Still remove tokens even if the API call fails
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('walletAddress');
      }
      
      return false;
    }
  }
}
