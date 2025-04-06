/**
 * Cached API client wrapper
 * Adds caching capabilities to the API client
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiCacheManager } from './cache-utils';
import apiClient from './api';

// Extend AxiosResponse type to include fromCache property
interface CachedAxiosResponse<T = any> extends AxiosResponse<T> {
  fromCache?: boolean;
}

// Create a cache manager instance with default settings
const apiCache = new ApiCacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes default TTL
  storagePrefix: 'api_cache_',
  useLocalStorage: true,
  maxEntries: 100
});

// Cache configuration for different endpoints
interface EndpointCacheConfig {
  ttl: number;            // Time to live in ms
  tags: string[];         // Tags for cache invalidation
  method?: 'GET' | 'POST'; // HTTP method (default: GET)
}

// Cache configuration by endpoint pattern
const cacheConfigs: Record<string, EndpointCacheConfig> = {
  // User profile - short cache, invalidated on user updates
  '/auth/profile': {
    ttl: 60 * 1000, // 1 minute
    tags: ['user', 'profile'],
  },
  
  // Token info - medium cache, invalidated on balance changes
  '/blockchain/token/info': {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['token'],
  },
  
  // Token stats - medium cache, invalidated on blockchain events
  '/blockchain/token/stats': {
    ttl: 10 * 60 * 1000, // 10 minutes
    tags: ['token', 'stats'],
  },
  
  // Wallet list - medium cache, invalidated on wallet changes
  '/wallets': {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['wallets'],
  },
  
  // NFT list - medium cache, invalidated on NFT transfers
  '/nfts': {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['nfts'],
  },
  
  // Staking tiers - long cache, rarely changes
  '/staking/apy-tiers': {
    ttl: 30 * 60 * 1000, // 30 minutes
    tags: ['staking'],
  },
  
  // Diary locations - very long cache, static data
  '/diary/locations/list': {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ['diary', 'static'],
  },
  
  // Referral stats - short cache, frequently updated
  '/referral/stats': {
    ttl: 2 * 60 * 1000, // 2 minutes
    tags: ['referral'],
  },
};

/**
 * Get the cache configuration for a given URL path
 * @param path URL path
 * @returns Cache configuration if the path should be cached, null otherwise
 */
function getCacheConfig(path: string, method: string = 'GET'): EndpointCacheConfig | null {
  // Only cache GET requests by default
  if (method !== 'GET' && method !== 'POST') return null;
  
  // Find matching configuration
  const matchingPath = Object.keys(cacheConfigs).find(pattern => {
    // Simple string match for now, could be extended to support regex
    return path.includes(pattern) && 
           (!cacheConfigs[pattern].method || cacheConfigs[pattern].method === method);
  });
  
  return matchingPath ? cacheConfigs[matchingPath] : null;
}

/**
 * Generate a cache key for a request
 * @param config Request configuration
 * @returns Cache key
 */
function generateCacheKey(config: AxiosRequestConfig): string {
  const { method = 'GET', url, params, data } = config;
  
  // Generate a cache key based on method, URL, query params, and request body
  let key = `${method}:${url}`;
  
  // Add query parameters to key if present
  if (params) {
    key += `:${JSON.stringify(params)}`;
  }
  
  // For POST requests, include request body in cache key
  if (method === 'POST' && data) {
    // For security reasons, don't include sensitive fields in the cache key
    const safeData = { ...data };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'signature'];
    
    sensitiveFields.forEach(field => {
      if (field in safeData) {
        delete safeData[field];
      }
    });
    
    key += `:${JSON.stringify(safeData)}`;
  }
  
  return key;
}

// Create cached API client by extending the original client
const cachedApiClient = axios.create({
  ...apiClient.defaults,
});

// Add request interceptor to handle caching
cachedApiClient.interceptors.request.use(
  async (config) => {
    // Clone the config to avoid modifying the original
    const newConfig = { ...config };
    
    // Check if this request should be cached
    const cacheConfig = getCacheConfig(config.url || '', config.method);
    if (cacheConfig && config.method) {
      // Generate cache key
      const cacheKey = generateCacheKey(config);
      
      // Check if response is in cache
      const cachedResponse = apiCache.get(cacheKey);
      
      if (cachedResponse) {
        // Set a flag to indicate this request is served from cache
        newConfig.adapter = async () => {
          return {
            data: cachedResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: newConfig,
            request: {
              responseURL: config.url,
            },
            fromCache: true
          } as CachedAxiosResponse;
        };
      }
    }
    
    return newConfig;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to cache responses
cachedApiClient.interceptors.response.use(
  (response: CachedAxiosResponse) => {
    // Skip caching if the response was already from cache
    if (response.fromCache) return response;
    
    const { config } = response;
    
    // Check if this response should be cached
    const cacheConfig = getCacheConfig(config.url || '', config.method);
    if (cacheConfig) {
      // Generate cache key
      const cacheKey = generateCacheKey(config);
      
      // Cache the response data (not the entire response object)
      apiCache.set(
        cacheKey,
        response.data,
        cacheConfig.ttl,
        cacheConfig.tags
      );
    }
    
    return response;
  },
  (error) => Promise.reject(error)
);

// Helper functions for cache manipulation
const cacheHelpers = {
  /**
   * Clear the entire cache
   */
  clearCache: () => apiCache.clear(),
  
  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag: (tag: string) => apiCache.invalidateByTag(tag),
  
  /**
   * Invalidate cache for a specific URL
   */
  invalidateUrl: (url: string, method: string = 'GET') => {
    const config = { url, method };
    const cacheKey = generateCacheKey(config);
    apiCache.remove(cacheKey);
  }
};

// Export the cached client and helpers
export default cachedApiClient;
export { cacheHelpers, apiCache };