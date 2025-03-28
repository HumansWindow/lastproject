import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private lastMemoryUsage = 0;
  private memoryIncreaseCount = 0;
  private gcRunCount = 0;
  
  // Check every 2 minutes instead of every minute to reduce overhead
  @Interval(120000)
  checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rssMemoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
    
    // Only log every other check to reduce console output
    if (this.gcRunCount % 2 === 0) {
      this.logger.debug(`Memory Usage - Heap: ${heapUsedMB}MB/${heapTotalMB}MB, RSS: ${rssMemoryMB}MB`);
    }
    
    // Check for memory leaks
    if (heapUsedMB > this.lastMemoryUsage) {
      this.memoryIncreaseCount++;
      
      // If memory usage increases for 3 consecutive checks, log a warning
      if (this.memoryIncreaseCount >= 3) {
        this.logger.warn(`Potential memory leak detected! Heap usage has been increasing: ${heapUsedMB}MB`);
        
        // Force garbage collection if available and memory is high
        if (heapUsedMB > 1000 && global.gc) {
          this.logger.log('Forcing garbage collection to free memory');
          try {
            global.gc();
            this.gcRunCount++;
          } catch (error) {
            this.logger.error(`Error running garbage collection: ${error.message}`);
          }
        }
        
        this.memoryIncreaseCount = 0;
      }
    } else {
      this.memoryIncreaseCount = 0;
    }
    
    this.lastMemoryUsage = heapUsedMB;
  }
}
