/**
 * Core API Client
 * 
 * This is the main API client that should be used throughout the application.
 * It integrates caching, security features, and more.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { setupCache } from 'axios-cache-adapter';
// Remove direct import of buildMemoryStorage and httpAdapter which are causing errors

// Get base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Define routes that should be cached
const CACHEABLE_ROUTES = [
  '/user/profile',
  '/wallets/list',
  '/token/info',
  '/referral/stats',
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

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Create cache with appropriate configuration
const cache = setupCache({
  maxAge: 15 * 60 * 1000, // 15 minutes
  // Remove store configuration as it's causing TypeScript errors
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

// Use the cache adapter directly without custom adapter
apiClient.defaults.adapter = cache.adapter;

// Add request interceptor to inject auth token and handle wallet requests specially
apiClient.interceptors.request.use(
  (config) => {
    // Special handling for wallet authentication endpoints
    if (config.url?.includes('/auth/wallet')) {
      // For wallet endpoints, ensure proper content type and timeout
      config.headers['Content-Type'] = 'application/json';
      config.timeout = config.timeout || 20000; // Use longer timeout for wallet operations
      
      // Add additional header to indicate wallet request (helps with debugging)
      config.headers['X-Wallet-Request'] = 'true';
    }
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
    const isAuthRefreshEndpoint = originalConfig.url?.includes('/auth/refresh');
    
    // Special handling for wallet authentication errors
    if (originalConfig.url?.includes('/auth/wallet')) {
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

        // Try to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`, 
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
}

// Add additional methods to the API client
const enhancedApiClient = apiClient as EnhancedApiClient;

// Reset the API client state
enhancedApiClient.resetState = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  delete apiClient.defaults.headers.common['Authorization'];
  
  // Clear cache by replacing the current adapter with a fresh one
  // This is a safer way to clear cache than using clearCache which isn't properly typed
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

// Check if user is currently connected to the system (migrated from base/api-client.ts)
enhancedApiClient.isUserConnected = () => {
  return !!localStorage.getItem('accessToken');
};

// Get detailed authentication state (migrated from base/api-client.ts)
enhancedApiClient.getAuthState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return {
    isAuthenticated: !!accessToken,
    hasRefreshToken: !!refreshToken
  };
};

// Export the enhanced API client
export { enhancedApiClient as apiClient };
export default enhancedApiClient;
