/**
 * Cache utilities for optimizing API requests
 * Implements in-memory and persistent caching strategies
 */

// Cache entry with expiration and metadata
interface CacheEntry<T> {
  value: T;
  expiry: number;
  timestamp: number;
  tags?: string[];
  accessCount?: number;
  lastAccessed?: number;
}

// Cache configuration
interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  storagePrefix: string;
  useLocalStorage: boolean;
  maxEntries: number;
  evictionPolicy?: EvictionPolicy;
  lowMemoryThreshold?: number; // Percentage of memory to trigger cleanup
}

// Eviction policy types
export enum EvictionPolicy {
  LRU = 'lru',  // Least Recently Used
  LFU = 'lfu',  // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  TTL = 'ttl'   // Expire by TTL only
}

// Default configuration
const defaultConfig: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storagePrefix: 'api_cache_',
  useLocalStorage: true,
  maxEntries: 100,
  evictionPolicy: EvictionPolicy.LRU,
  lowMemoryThreshold: 0.85 // 85%
};

/**
 * API Cache Manager
 * Provides caching for API responses with TTL and tag-based invalidation
 */
export class ApiCacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.cache = new Map();

    // Load cache from localStorage if enabled
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  public get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.cache.get(key);
    
    if (memoryEntry && this.isValid(memoryEntry)) {
      // Update usage statistics for eviction policies
      this.updateEntryStats(key, memoryEntry);
      return memoryEntry.value as T;
    }

    // If not in memory but localStorage is enabled, try there
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      const storageKey = this.getStorageKey(key);
      const storedValue = localStorage.getItem(storageKey);
      
      if (storedValue) {
        try {
          const entry = JSON.parse(storedValue) as CacheEntry<T>;
          
          if (this.isValid(entry)) {
            // Update usage statistics for eviction policies
            this.updateEntryStats(key, entry);
            // Add back to memory cache
            this.cache.set(key, entry);
            return entry.value;
          } else {
            // Remove expired entry
            localStorage.removeItem(storageKey);
          }
        } catch (e) {
          // Invalid JSON, remove it
          localStorage.removeItem(storageKey);
        }
      }
    }

    return null;
  }

  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   * @param tags Optional tags for invalidation
   */
  public set<T>(key: string, value: T, ttl?: number, tags?: string[]): void {
    const now = Date.now();
    const expiryTime = now + (ttl || this.config.defaultTTL);
    
    const entry: CacheEntry<T> = {
      value,
      expiry: expiryTime,
      timestamp: now,
      tags,
      accessCount: 1,
      lastAccessed: now
    };

    // Ensure we don't exceed max entries
    if (this.cache.size >= this.config.maxEntries) {
      this.evictEntries(1);
    }

    // Set in memory cache
    this.cache.set(key, entry);

    // Set in localStorage if enabled
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
      } catch (e) {
        // If localStorage fails (e.g., quota exceeded), just keep in memory
        console.warn('Failed to store in localStorage, keeping in memory only:', e);
        
        // Try to free up some space by removing less important entries
        if (this.isStorageQuotaError(e)) {
          this.handleStorageQuotaExceeded();
        }
      }
    }
  }

  /**
   * Remove an item from the cache
   * @param key Cache key
   */
  public remove(key: string): void {
    this.cache.delete(key);
    
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.getStorageKey(key));
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      // Only remove keys with our prefix
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Invalidate cache entries by tag
   * @param tag Tag to invalidate
   */
  public invalidateByTag(tag: string): void {
    // Find keys to remove
    const keysToRemove: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags && entry.tags.includes(tag)) {
        keysToRemove.push(key);
      }
    });

    // Remove from both memory and storage
    keysToRemove.forEach(key => this.remove(key));
  }

  /**
   * Check if a cache entry is still valid
   * @param entry Cache entry
   * @returns Whether the entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return entry.expiry > Date.now();
  }

  /**
   * Get storage key with prefix
   * @param key Original key
   * @returns Prefixed storage key
   */
  private getStorageKey(key: string): string {
    return `${this.config.storagePrefix}${key}`;
  }

  /**
   * Update entry statistics for eviction policies
   */
  private updateEntryStats(key: string, entry: CacheEntry<any>): void {
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccessed = Date.now();
    
    // Update in memory
    this.cache.set(key, entry);
    
    // Update in storage if needed
    // Note: we don't update localStorage on every access for performance reasons
    // This could be enabled as an optional feature via a "persistAccessStats" config option
  }

  /**
   * Remove entries based on the configured eviction policy
   * @param count Number of entries to evict
   * @returns Number of entries actually evicted
   */
  public evictEntries(count: number): number {
    if (count <= 0 || this.cache.size === 0) return 0;
    
    const toEvict = Math.min(count, this.cache.size);
    let evicted = 0;
    
    switch (this.config.evictionPolicy) {
      case EvictionPolicy.LRU:
        evicted = this.evictLRU(toEvict);
        break;
      case EvictionPolicy.LFU:
        evicted = this.evictLFU(toEvict);
        break;
      case EvictionPolicy.FIFO:
        evicted = this.evictFIFO(toEvict);
        break;
      case EvictionPolicy.TTL:
      default:
        evicted = this.evictExpiring(toEvict);
        break;
    }
    
    return evicted;
  }

  /**
   * Evict the least recently used entries
   */
  private evictLRU(count: number): number {
    if (count <= 0) return 0;
    
    // Sort by last accessed timestamp
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp));
    
    // Remove the oldest accessed entries
    return this.removeEntries(entries.slice(0, count).map(([key]) => key));
  }

  /**
   * Evict the least frequently used entries
   */
  private evictLFU(count: number): number {
    if (count <= 0) return 0;
    
    // Sort by access count and then by timestamp for ties
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        const countDiff = (a.accessCount || 1) - (b.accessCount || 1);
        if (countDiff !== 0) return countDiff;
        return a.timestamp - b.timestamp;
      });
    
    // Remove the least frequently used entries
    return this.removeEntries(entries.slice(0, count).map(([key]) => key));
  }

  /**
   * Evict the oldest entries (first in, first out)
   */
  private evictFIFO(count: number): number {
    if (count <= 0) return 0;
    
    // Sort by creation timestamp
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove the oldest entries
    return this.removeEntries(entries.slice(0, count).map(([key]) => key));
  }

  /**
   * Evict entries that are closest to expiry
   */
  private evictExpiring(count: number): number {
    if (count <= 0) return 0;
    
    // Sort by expiration time
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.expiry - b.expiry);
    
    // Remove the entries closest to expiration
    return this.removeEntries(entries.slice(0, count).map(([key]) => key));
  }

  /**
   * Remove a list of entries by key
   */
  private removeEntries(keys: string[]): number {
    let count = 0;
    
    keys.forEach(key => {
      this.remove(key);
      count++;
    });
    
    return count;
  }

  /**
   * Evict a specific number of oldest entries
   * @param count Number of entries to remove
   * @returns Number of entries removed
   */
  public evictOldestEntries(count: number): number {
    return this.evictEntries(count);
  }
  
  /**
   * Get the approximate size of the cache in bytes
   * This is an estimation as it's difficult to accurately measure object sizes in JS
   */
  public getApproximateSize(): number {
    let size = 0;
    
    this.cache.forEach((entry) => {
      // Approximate size calculation
      const valueSize = this.estimateObjectSize(entry.value);
      const metadataSize = 200; // Rough estimate for metadata
      size += valueSize + metadataSize;
    });
    
    return size;
  }
  
  /**
   * Estimate object size in bytes
   * This is a rough approximation
   */
  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    const type = typeof obj;
    
    if (type === 'string') return (obj as string).length * 2; // UTF-16 characters are 2 bytes
    if (type === 'number') return 8; // Assuming 64-bit floating point
    if (type === 'boolean') return 4; // Common size for boolean
    if (type === 'object') {
      if (Array.isArray(obj)) {
        return obj.reduce((size, item) => size + this.estimateObjectSize(item), 0);
      } else {
        // Calculate size of object's properties
        let size = 0;
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            size += key.length * 2; // Key size (UTF-16)
            size += this.estimateObjectSize(obj[key]); // Value size
          }
        }
        return size;
      }
    }
    
    return 8; // Default size for other types
  }

  /**
   * Get the number of entries in the cache
   */
  public getSize(): number {
    return this.cache.size;
  }

  /**
   * Clear all expired entries
   * @returns Number of entries cleared
   */
  public clearExpiredEntries(): number {
    const now = Date.now();
    let count = 0;
    
    // Find expired entries
    const expiredKeys: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.expiry <= now) {
        expiredKeys.push(key);
      }
    });
    
    // Remove expired entries
    expiredKeys.forEach(key => {
      this.remove(key);
      count++;
    });
    
    return count;
  }

  /**
   * Handle storage quota exceeded error
   */
  private handleStorageQuotaExceeded(): void {
    // Try to make room by removing 20% of the entries
    const entriesToRemove = Math.ceil(this.cache.size * 0.2);
    
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      // Clear entries from localStorage first
      const evicted = this.evictEntries(entriesToRemove);
      console.warn(`Storage quota exceeded. Removed ${evicted} entries from cache.`);
    }
  }

  /**
   * Check if an error is a storage quota error
   */
  private isStorageQuotaError(error: any): boolean {
    return error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      /quota|storage/i.test(error.message)
    );
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          const actualKey = key.substring(this.config.storagePrefix.length);
          const storedValue = localStorage.getItem(key);
          
          if (storedValue) {
            try {
              const entry = JSON.parse(storedValue) as CacheEntry<any>;
              
              if (this.isValid(entry)) {
                this.cache.set(actualKey, entry);
              } else {
                // Remove expired entry
                localStorage.removeItem(key);
              }
            } catch (e) {
              // Invalid JSON, remove it
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading cache from localStorage:', e);
    }
  }
}