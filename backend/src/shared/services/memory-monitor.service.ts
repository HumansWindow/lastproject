import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private memoryUsageHistory: { timestamp: number; heapUsed: number; rss: number }[] = [];
  private readonly historyLimit = 12; // Increase tracking period to 12 minutes
  private readonly significantGrowthThreshold = 1.3; // Lower threshold to 30% growth
  private readonly gcThreshold = 0.75; // Lower threshold for triggering GC suggestion
  private consecutiveHighMemoryAlerts = 0;
  private readonly restartSuggestionThreshold = 5; // Suggest restart after 5 consecutive alerts
  
  constructor() {
    // Log startup memory stats for baseline
    const initialMemory = process.memoryUsage();
    this.logger.log(`Initial memory state - Heap: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB, RSS: ${Math.round(initialMemory.rss / 1024 / 1024)}MB`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  handleMemoryMonitoring() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

    // Only log every 5 minutes for normal operation to reduce verbosity
    if (this.memoryUsageHistory.length % 5 === 0) {
      this.logger.debug(`Memory Usage - Heap: ${heapUsedMB}MB/${heapTotalMB}MB, RSS: ${rssMB}MB`);
    }

    // Store history for leak detection
    this.memoryUsageHistory.push({
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      rss: memoryUsage.rss
    });
    
    // Keep history limited
    if (this.memoryUsageHistory.length > this.historyLimit) {
      this.memoryUsageHistory.shift();
    }

    // Check for significant memory growth that could indicate a leak
    this.checkForMemoryLeaks();

    // Force garbage collection when memory usage is high
    const memoryRatio = heapUsedMB / heapTotalMB;
    if (memoryRatio > this.gcThreshold) {
      this.logger.warn(`High memory usage detected: ${heapUsedMB}MB / ${heapTotalMB}MB (${Math.round(memoryRatio * 100)}%)`);
      
      this.consecutiveHighMemoryAlerts++;
      
      // Try to clean up memory
      this.attemptMemoryOptimization();
      
      // Suggest service restart if memory issues persist
      if (this.consecutiveHighMemoryAlerts >= this.restartSuggestionThreshold) {
        this.logger.error(`Persistent high memory usage detected for ${this.consecutiveHighMemoryAlerts} consecutive checks. Service restart recommended.`);
      }
    } else {
      // Reset consecutive counter if memory usage is normal
      if (this.consecutiveHighMemoryAlerts > 0) {
        this.logger.log('Memory usage has returned to normal levels');
        this.consecutiveHighMemoryAlerts = 0;
      }
    }
  }

  private checkForMemoryLeaks() {
    if (this.memoryUsageHistory.length < 3) return;

    const oldest = this.memoryUsageHistory[0];
    const newest = this.memoryUsageHistory[this.memoryUsageHistory.length - 1];
    
    // Calculate growth trends
    const timeElapsedMinutes = (newest.timestamp - oldest.timestamp) / (60 * 1000);
    const heapGrowthRatio = newest.heapUsed / oldest.heapUsed;
    const rssGrowthRatio = newest.rss / oldest.rss;
    
    // Check if memory has consistently grown
    const isConsistentGrowth = this.memoryUsageHistory.every((entry, i) => 
      i === 0 || entry.heapUsed >= this.memoryUsageHistory[i-1].heapUsed
    );
      
    if (isConsistentGrowth && heapGrowthRatio > this.significantGrowthThreshold) {
      this.logger.warn(
        `Possible memory leak detected! Heap memory grew by ${Math.round((heapGrowthRatio - 1) * 100)}% ` +
        `over ${timeElapsedMinutes.toFixed(1)} minutes. ` +
        `Current: ${Math.round(newest.heapUsed / 1024 / 1024)}MB, ` +
        `Previous: ${Math.round(oldest.heapUsed / 1024 / 1024)}MB`
      );
      
      // Log memory-heavy operations if significant growth
      if (heapGrowthRatio > 1.5) {
        this.logMemoryConsumingOperations();
      }
    }
  }
  
  private attemptMemoryOptimization() {
    // Suggest garbage collection
    if (global.gc) {
      this.logger.log('Running manual garbage collection');
      try {
        global.gc();
      } catch (error) {
        this.logger.error('Error during garbage collection:', error);
      }
    } else {
      this.logger.warn('Manual garbage collection unavailable. Run Node with --expose-gc to enable.');
    }
  }
  
  private logMemoryConsumingOperations() {
    // This method can be expanded to identify specific components or operations
    // consuming excessive memory based on your application architecture
    this.logger.warn('Consider checking these potential memory-heavy operations:');
    this.logger.warn('1. Wallet authentication sessions that are not being cleaned up');
    this.logger.warn('2. Database connection pools that may be growing unbounded');
    this.logger.warn('3. Large cached objects that are not being properly evicted');
    this.logger.warn('4. Event listeners or subscriptions that are not being removed');
  }
}
