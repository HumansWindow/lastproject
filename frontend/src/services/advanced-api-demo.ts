/**
 * API Client Advanced Features Demo
 * 
 * This file demonstrates how to use the advanced memory management
 * and automatic cache eviction policies in your application.
 */

import { apiCache, cacheHelpers } from './cached-api';
import { memoryManager } from './memory-manager';
import { EvictionPolicy } from './cache-utils';
import apiClient from './api';
import { AxiosResponse } from 'axios';

// Define interface for fetch options
interface FetchOptions {
  cacheKey?: string;
  cacheTTL?: number;
  cacheTags?: string[];
  forceRefresh?: boolean;
}

// Define interface for profile data
interface ProfileData {
  [key: string]: any;
}

/**
 * Example of configuring the memory manager for optimal performance
 */
function setupMemoryManager() {
  // Configure memory manager with custom settings
  memoryManager.configure({
    checkInterval: 30000,  // Check memory usage every 30 seconds
    memoryThreshold: 0.8,  // Trigger cleanup at 80% memory usage
    maxCacheSize: 15 * 1024 * 1024,  // 15MB max cache size
    cacheSizeInterval: 20000,  // Check cache size every 20 seconds
    logStats: true  // Enable logging for debugging
  });
  
  // Start memory manager (it auto-starts, but if you stopped it manually)
  memoryManager.start();
  
  // Example of responding to page visibility changes to optimize memory usage
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, run a memory cleanup to free resources
        memoryManager.performMemoryCleanup();
      }
    });
  }
  
  // Example of manual cleanup when needed
  function handleLowMemoryCondition() {
    // Get current cache stats
    const stats = memoryManager.getCacheStats();
    console.log(`Cache status: ${stats.entryCount} entries, ~${Math.round(stats.size / 1024)}KB`);
    
    // Do aggressive cleanup if needed
    memoryManager.performMemoryCleanup(true);
  }
  
  return {
    handleLowMemoryCondition,
    getStats: () => memoryManager.getCacheStats()
  };
}

/**
 * Example of configuring cache eviction policies
 */
function configureCachePolicy() {
  // Example of creating a new ApiCacheManager with LFU policy
  const createCacheWithPolicy = (policy: EvictionPolicy) => {
    // Replace in your actual implementation
    console.log(`Created cache with ${policy} eviction policy`);
  };
  
  // Examples of different cache eviction policies:
  
  // LRU - Least Recently Used (default)
  // Best for: Most general use cases where recent access predicts future access
  createCacheWithPolicy(EvictionPolicy.LRU);
  
  // LFU - Least Frequently Used
  // Best for: When access frequency is more important than recency
  // Good for hot/cold data patterns where some items are consistently popular
  createCacheWithPolicy(EvictionPolicy.LFU);
  
  // FIFO - First In First Out
  // Best for: Simplicity and when data has a natural lifecycle
  createCacheWithPolicy(EvictionPolicy.FIFO);
  
  // TTL - Time To Live based eviction
  // Best for: When expiration time is the primary concern
  // Good for data with strict freshness requirements
  createCacheWithPolicy(EvictionPolicy.TTL);
}

/**
 * Example of a complete memory-optimized API fetch function
 */
async function fetchWithOptimizedCaching(url: string, options: FetchOptions = {}): Promise<any> {
  const {
    cacheKey = url,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    cacheTags = [],
    forceRefresh = false
  } = options;
  
  // Try cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${url}`);
      return cachedData;
    }
  }
  
  try {
    // Actual API call
    const response = await apiClient.get(url);
    
    // Before caching, check if we need to free memory
    memoryManager.freeMemoryIfNeeded();
    
    // Cache the response
    apiCache.set(cacheKey, response.data, cacheTTL, cacheTags);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Example usage in a component or service
 */
async function exampleUsage() {
  // Setup memory management
  const memory = setupMemoryManager();
  
  // Configure cache policy (already done globally, but can be customized)
  configureCachePolicy();
  
  // Fetch data with optimized caching
  try {
    // User profile - short TTL, tagged as 'user'
    const profile = await fetchWithOptimizedCaching('/auth/profile', {
      cacheTTL: 60 * 1000, // 1 minute
      cacheTags: ['user', 'profile']
    });
    console.log('User profile:', profile);
    
    // NFT list - longer TTL, tagged as 'nfts'
    const nfts = await fetchWithOptimizedCaching('/nfts', {
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      cacheTags: ['nfts']
    });
    console.log('NFTs:', nfts);
    
    // Update profile example - move function declaration outside of block
    memory.getStats();
    
    // Example of handling low memory
    window.addEventListener('devicememorychange', () => {
      if ((navigator as any).deviceMemory < 4) { // Less than 4GB
        memory.handleLowMemoryCondition();
      }
    });
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Update profile function moved outside of block to fix strict mode error
async function updateProfile(profileData: ProfileData): Promise<void> {
  await apiClient.put('/auth/profile', profileData);
  
  // Invalidate all 'user' tagged cache entries
  cacheHelpers.invalidateByTag('user');
}

// Example export for use in actual code
export {
  setupMemoryManager,
  configureCachePolicy,
  fetchWithOptimizedCaching,
  exampleUsage,
  updateProfile
};

// Auto-run example if this file is executed directly
if (typeof window !== 'undefined' && (window as any).runExample) {
  exampleUsage();
}