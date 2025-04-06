import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private memoryUsageHistory: { timestamp: number; heapUsed: number }[] = [];
  private readonly historyLimit = 10;
  private readonly significantGrowthThreshold = 1.5; // 50% growth between checks

  @Cron(CronExpression.EVERY_MINUTE)
  handleMemoryMonitoring() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

    this.logger.debug(`Memory Usage - Heap: ${heapUsedMB}MB/${heapTotalMB}MB, RSS: ${rssMB}MB`);

    // Store history for leak detection
    this.memoryUsageHistory.push({
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
    });
    
    // Keep history limited
    if (this.memoryUsageHistory.length > this.historyLimit) {
      this.memoryUsageHistory.shift();
    }

    // Check for significant memory growth that could indicate a leak
    this.checkForMemoryLeaks();

    // Force garbage collection when memory usage is high
    if (heapUsedMB > heapTotalMB * 0.8) {
      this.logger.warn('High memory usage detected, suggesting manual garbage collection');
      // Note: We can't force GC directly in standard Node.js, but we can suggest it
      if (global.gc) {
        this.logger.log('Running garbage collection');
        global.gc();
      }
    }
  }

  private checkForMemoryLeaks() {
    if (this.memoryUsageHistory.length < 2) return;

    const oldest = this.memoryUsageHistory[0];
    const newest = this.memoryUsageHistory[this.memoryUsageHistory.length - 1];
    
    // Check if memory has consistently grown
    if (this.memoryUsageHistory.every((entry, i) => 
      i === 0 || entry.heapUsed >= this.memoryUsageHistory[i-1].heapUsed)) {
        
      const growthRatio = newest.heapUsed / oldest.heapUsed;
      if (growthRatio > this.significantGrowthThreshold) {
        this.logger.warn(`Possible memory leak detected! Memory grew by ${Math.round((growthRatio - 1) * 100)}% in the last ${this.historyLimit} minutes.`);
      }
    }
  }
}
