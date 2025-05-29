/**
 * Core API Client
 * 
 * This is the main API client that should be used throughout the application.
 * It integrates caching, security features, and more.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { setupCache } from 'axios-cache-adapter';
import { endpoints, apiClientConfig } from "@/config/api.config";

// Import API_URL separately since it's a named export
import apiConfig from "@/config/api.config";
const { API_URL } = apiConfig;

// Define routes that should be cached
const CACHEABLE_ROUTES = [
  '/user/profile',
  '/wallets/list',
  '/token/info',
  '/referral/stats',
  '/nft/list',
  '/diary/stats',
];

// Track request queue during token refresh
let isRefreshing = false;
let failedRequestsQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Process the request queue
const processQueue = (error: Error | null, token: string | null = null) => {
  failedRequestsQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.config.headers['Authorization'] = `Bearer ${token}`;
      request.resolve(axios(request.config));
    }
  });
  
  failedRequestsQueue = [];
};

// Function to get the backend URL - always uses API_URL (port 3001)
const getWorkingBackendUrl = async (): Promise<string> => {
  console.log(`Using backend API URL: ${API_URL} (port 3001)`);
  return API_URL;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: apiClientConfig.timeout,
  headers: apiClientConfig.headers,
  withCredentials: false  // Changed to false to avoid CORS issues with wallet authentication
});

// Create cache with appropriate configuration
const cache = setupCache({
  maxAge: 15 * 60 * 1000, // 15 minutes
  exclude: {
    // Don't cache POST, PUT, DELETE requests
    methods: ['post', 'put', 'delete', 'patch'],
    
    // Don't cache auth endpoints
    filter: (request) => {
      // Skip caching for auth endpoints
      if (request.url && request.url.includes('/auth/')) {
        return true; // exclude from cache
      }
      
      // Only cache specific GET endpoints
      if (request.method === 'get') {
        // Check if this is a cacheable route
        return !CACHEABLE_ROUTES.some(route => 
          request.url && request.url.includes(route)
        );
      }
      
      return true; // exclude by default
    }
  },
  debug: process.env.NODE_ENV !== 'production'
});

// Create a standard axios instance without cache for auth operations
const authClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Longer timeout for auth operations
  headers: {
    ...apiClientConfig.headers,
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Use the cache adapter only for the main apiClient
apiClient.defaults.adapter = cache.adapter;

// Add request interceptor to inject auth token and handle wallet requests specially
apiClient.interceptors.request.use(
  async (config) => {
    // Special handling for wallet authentication endpoints
    if (config.url?.includes('/auth/wallet')) {
      // For wallet endpoints, ensure proper content type and timeout
      config.headers['Content-Type'] = 'application/json';
      config.timeout = config.timeout || 30000; // Use longer timeout for wallet operations
      
      // Don't add any custom headers that might trigger CORS preflight checks
      
      // Find a working backend URL for wallet requests
      
      const workingUrl = await getWorkingBackendUrl();
      
      // If the baseURL is different from the working URL, update it for this request only
      if (workingUrl !== API_URL) {
        // Extract endpoint path from original URL
        const endpoint = config.url.replace(/^https?:\/\/[^/]+/, '');
        
        // Create a full URL with the working backend URL
        config.url = `${workingUrl}${endpoint}`;
      }
      
      // Skip adding any additional headers for wallet requests to avoid CORS issues
      return config;
    }
    
    // For all other requests, proceed with normal behavior
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh and wallet-specific errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Get original request that failed
    const originalConfig = error.config;
    
    if (!originalConfig) {
      return Promise.reject(error);
    }

    // Avoid infinite loop for refresh token requests
    const isAuthRefreshEndpoint = originalConfig.url?.includes('/auth/refresh-token');
    
    // Special handling for wallet authentication errors
    if (originalConfig.url?.includes('/auth/wallet')) {
      // Check if it's a connection refused error
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.error('Wallet connection error (network issue):', error.message);
        
        // Try to find an alternative working endpoint
        try {
          const workingUrl = await getWorkingBackendUrl();
          
          // Extract endpoint path from original URL
          let endpoint = originalConfig.url;
          // If URL is absolute, extract just the path
          if (endpoint.startsWith('http')) {
            endpoint = endpoint.replace(/^https?:\/\/[^/]+/, '');
          }
          
          // Create a new URL with the working backend
          const newUrl = `${workingUrl}${endpoint}`;
          console.log(`Retrying wallet request with alternative URL: ${newUrl}`);
          
          // Retry the request with the new URL
          originalConfig.url = newUrl;
          
          // Set baseURL to null to avoid it being prepended to the URL again
          originalConfig.baseURL = '';
          
          // Try the request again
          return authClient(originalConfig);
        } catch (retryError) {
          console.error('Failed to retry wallet request with alternative URL:', retryError);
        }
      }
      
      // Enhanced error for wallet connection issues
      console.error('Wallet connection error:', error.message);
      
      // Get better error message if available
      const errorMessage = error.response?.data?.message || error.message;
      
      // Create a more descriptive error
      const enhancedError = new Error(
        `Wallet connection error: ${errorMessage}. Please check your wallet extension and try again.`
      );
      
      // Add additional context to the error
      (enhancedError as any).originalError = error;
      (enhancedError as any).isWalletError = true;
      
      return Promise.reject(enhancedError);
    }
    
    // Handle 401 errors (unauthorized) with token refresh
    if (error.response?.status === 401 && !isAuthRefreshEndpoint && !originalConfig._retry) {
      // Mark to avoid retry loops
      originalConfig._retry = true;
      
      // If token refresh is in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve,
            reject,
            config: originalConfig,
          });
        });
      }
      
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token available
          processQueue(new Error('No refresh token available'));
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          // If in browser, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login?session=expired';
          }
          
          return Promise.reject(error);
        }

        // Try to find a working backend URL for token refresh
        const workingUrl = await getWorkingBackendUrl();
        
        // Try to refresh the token
        const response = await authClient.post(
          `/auth/refresh-token`, 
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update auth header for the original request
        originalConfig.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue(null, accessToken);
        
        // Retry the original request
        return apiClient(originalConfig);
      } catch (refreshError) {
        // Token refresh failed
        processQueue(refreshError as Error);
        
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // If in browser, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Apply the same interceptors to authClient
authClient.interceptors.request.use(
  async (config) => {
    // Get JWT token from localStorage for auth requests too
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extended API client with additional utility methods
 */
interface EnhancedApiClient extends AxiosInstance {
  /**
   * Reset the API client state
   * Useful for logging out or testing
   */
  resetState: () => void;
  
  /**
   * Get the current authorization token
   */
  getToken: () => string | null;
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated: () => boolean;
  
  /**
   * Set a new authorization token
   */
  setToken: (token: string) => void;
  
  /**
   * Clear the authorization token
   */
  clearToken: () => void;
  
  /**
   * Check if user is currently connected/authenticated to the system
   * @returns Boolean indicating if the user is connected
   */
  isUserConnected: () => boolean;
  
  /**
   * Get current user's authentication state with more details
   * @returns Object with authentication details
   */
  getAuthState: () => { isAuthenticated: boolean; hasRefreshToken: boolean };

  /**
   * Connect wallet to the system
   * @param address Wallet address
   * @returns Object containing nonce
   */
  connectWallet: (address: string) => Promise<{ nonce: string }>;

  /**
   * Authenticate wallet with the system
   * @param address Wallet address
   * @param signature Wallet signature
   * @param nonce Nonce for authentication
   * @returns Object containing authentication details
   */
  authenticateWallet: (address: string, signature: string, nonce: string) => Promise<any>;
  
  /**
   * Get the best working backend URL
   * @returns Promise that resolves to the best working backend URL
   */
  getWorkingBackendUrl: () => Promise<string>;
}

// Add additional methods to the API client
const enhancedApiClient = apiClient as EnhancedApiClient;

// Reset the API client state
enhancedApiClient.resetState = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete apiClient.defaults.headers.common['Authorization'];
  
  // Clear cache by replacing the current adapter with a fresh one
  const freshCache = setupCache({
    maxAge: 15 * 60 * 1000,
    exclude: {
      methods: ['post', 'put', 'delete', 'patch'],
      filter: (request) => {
        if (request.url && request.url.includes('/auth/')) {
          return true;
        }
        if (request.method === 'get') {
          return !CACHEABLE_ROUTES.some(route => 
            request.url && request.url.includes(route)
          );
        }
        return true;
      }
    },
    debug: process.env.NODE_ENV !== 'production'
  });
  
  // Update adapter with the fresh cache
  apiClient.defaults.adapter = freshCache.adapter;
};

// Get the current authorization token
enhancedApiClient.getToken = () => {
  return localStorage.getItem('accessToken');
};

// Check if the user is authenticated
enhancedApiClient.isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

// Set a new authorization token
enhancedApiClient.setToken = (token: string) => {
  localStorage.setItem('accessToken', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Clear the authorization token
enhancedApiClient.clearToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete apiClient.defaults.headers.common['Authorization'];
};

// Check if user is currently connected to the system
enhancedApiClient.isUserConnected = () => {
  return !!localStorage.getItem('accessToken');
};

// Get detailed authentication state
enhancedApiClient.getAuthState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return {
    isAuthenticated: !!accessToken,
    hasRefreshToken: !!refreshToken
  };
};

// Add wallet-specific methods
enhancedApiClient.connectWallet = async (address: string): Promise<{ nonce: string }> => {
  try {
    // Use the authClient (without cache adapter) for wallet connect operations
    const response = await authClient.post('/auth/wallet/connect', { address });
    console.log('Wallet connect response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Wallet connect error:', error);
    throw error;
  }
};

enhancedApiClient.authenticateWallet = async (address: string, signature: string, nonce: string) => {
  try {
    // Use the authClient (without cache adapter) for wallet authentication
    const response = await authClient.post('/auth/wallet/authenticate', {
      address: address, // Changed from walletAddress to address to match backend expectations
      signature,
      message: nonce
    });
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('walletAddress', address);
    
    // Store userId if available for session management
    if (user && user.id) {
      localStorage.setItem('userId', user.id);
    } else if (response.data.userId) {
      localStorage.setItem('userId', response.data.userId);
    }
    
    // Set auth header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    return response.data;
  } catch (error) {
    console.error('Wallet authentication error:', error);
    throw error;
  }
};

// Expose the getWorkingBackendUrl function
enhancedApiClient.getWorkingBackendUrl = getWorkingBackendUrl;

// Export the enhanced API client
export { enhancedApiClient as apiClient };
export default enhancedApiClient;
