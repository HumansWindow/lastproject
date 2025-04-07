/**
 * Memory Manager Service
 * Provides advanced memory management for API client and caching system
 * - Monitors memory usage
 * - Automatically frees unused resources
 * - Prevents memory leaks in long-running applications
 */

import { apiCache } from '../../api/client/optimized/cached-api';

// Add custom interface for Performance with memory extension (Chrome-specific)
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

// Configuration for memory manager
interface MemoryConfig {
  // How often to check memory usage (ms)
  checkInterval: number;
  
  // High water mark percentage (0-1) of available memory
  memoryThreshold: number;
  
  // Maximum cache size in bytes (approximate)
  maxCacheSize: number;
  
  // Cache size check interval (ms)
  cacheSizeInterval: number;
  
  // Should we log memory stats to console?
  logStats: boolean;
}

// Default configuration
const DEFAULT_CONFIG: MemoryConfig = {
  checkInterval: 60000, // Check every minute
  memoryThreshold: 0.85, // 85% threshold
  maxCacheSize: 10 * 1024 * 1024, // 10MB max cache
  cacheSizeInterval: 30000, // Check cache size every 30 seconds
  logStats: false
};

class MemoryManager {
  private config: MemoryConfig;
  private memoryMonitorTimer: number | null = null;
  private cacheSizeTimer: number | null = null;
  private isRunning = false;
  private lastCacheSize = 0;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the memory manager
   */
  public start(): void {
    if (this.isRunning) return;
    
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    this.isRunning = true;
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Start cache size monitoring
    this.startCacheSizeMonitoring();
    
    this.log('Memory manager started');
  }

  /**
   * Stop the memory manager
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.memoryMonitorTimer) {
      window.clearInterval(this.memoryMonitorTimer);
      this.memoryMonitorTimer = null;
    }
    
    if (this.cacheSizeTimer) {
      window.clearInterval(this.cacheSizeTimer);
      this.cacheSizeTimer = null;
    }
    
    this.log('Memory manager stopped');
  }

  /**
   * Configure the memory manager
   */
  public configure(config: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart timers if running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Free memory if approaching limits
   * Returns true if memory was freed
   */
  public freeMemoryIfNeeded(): boolean {
    // Skip if not in browser
    if (typeof window === 'undefined' || !window.performance) return false;
    
    // Check memory usage if available (Chrome-specific API)
    const performance = window.performance as ExtendedPerformance;
    if (performance && performance.memory) {
      const memoryInfo = performance.memory;
      
      if (memoryInfo.usedJSHeapSize && memoryInfo.jsHeapSizeLimit) {
        const usedRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        
        if (usedRatio > this.config.memoryThreshold) {
          this.log(`Memory threshold exceeded: ${Math.round(usedRatio * 100)}%`);
          
          // Clean the cache aggressively
          return this.performMemoryCleanup(true);
        }
      }
    }
    
    return false;
  }

  /**
   * Perform a memory cleanup operation
   * @param aggressive If true, performs a more aggressive cleanup
   * @returns true if cleanup was performed
   */
  public performMemoryCleanup(aggressive = false): boolean {
    if (!apiCache) return false;
    
    try {
      if (aggressive) {
        // For aggressive cleanup:
        // 1. Calculate how many items to remove (half the cache if aggressive)
        const removalRatio = aggressive ? 0.5 : 0.25;
        const entriesToRemove = Math.ceil(apiCache.getSize() * removalRatio);
        
        // 2. Clear old items based on the number to remove
        const removed = apiCache.evictOldestEntries(entriesToRemove);
        
        this.log(`Aggressively removed ${removed} cache entries`);
        
        // 3. Run garbage collection if possible (not standard, but some browsers support it)
        if ((window as any).gc) {
          try {
            (window as any).gc();
            this.log('Manual garbage collection triggered');
          } catch (e) {
            // Ignore errors, gc might not be available
          }
        }
        
        return true;
      } else {
        // For normal cleanup:
        // Just clear expired entries and items approaching expiry
        const cleaned = apiCache.clearExpiredEntries();
        
        if (cleaned > 0) {
          this.log(`Removed ${cleaned} expired cache entries`);
          return true;
        }
      }
    } catch (e) {
      console.error('Error during memory cleanup:', e);
    }
    
    return false;
  }

  /**
   * Start the memory monitoring process
   */
  private startMemoryMonitoring(): void {
    if (this.memoryMonitorTimer) {
      window.clearInterval(this.memoryMonitorTimer);
    }
    
    this.memoryMonitorTimer = window.setInterval(() => {
      this.freeMemoryIfNeeded();
    }, this.config.checkInterval);
  }

  /**
   * Start monitoring cache size
   */
  private startCacheSizeMonitoring(): void {
    if (this.cacheSizeTimer) {
      window.clearInterval(this.cacheSizeTimer);
    }
    
    this.cacheSizeTimer = window.setInterval(() => {
      this.checkCacheSize();
    }, this.config.cacheSizeInterval);
  }

  /**
   * Check the size of the cache and reduce if needed
   */
  private checkCacheSize(): void {
    if (!apiCache) return;
    
    try {
      const approximateSize = apiCache.getApproximateSize();
      this.lastCacheSize = approximateSize;
      
      if (approximateSize > this.config.maxCacheSize) {
        const overageRatio = approximateSize / this.config.maxCacheSize;
        const removalRatio = 1 - (1 / overageRatio);
        const entriesToRemove = Math.ceil(apiCache.getSize() * removalRatio);
        
        this.log(`Cache size (${Math.round(approximateSize / 1024)}KB) exceeds limit, removing ${entriesToRemove} entries`);
        apiCache.evictOldestEntries(entriesToRemove);
      }
    } catch (e) {
      console.error('Error checking cache size:', e);
    }
  }

  /**
   * Log a message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.logStats) {
      console.log(`[MemoryManager] ${message}`);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number, entryCount: number } {
    return {
      size: this.lastCacheSize,
      entryCount: apiCache ? apiCache.getSize() : 0
    };
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager();

// Automatically start in browser environment
if (typeof window !== 'undefined') {
  // Delay start to ensure all services are initialized
  setTimeout(() => {
    memoryManager.start();
  }, 1000);
}

// Add a cleanup function to window unload event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Perform final cleanup
    memoryManager.performMemoryCleanup(true);
  });
}

// Export for direct usage
export default memoryManager;