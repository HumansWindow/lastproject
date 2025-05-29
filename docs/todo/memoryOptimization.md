# Memory Optimization Plan

## Overview

Based on the server logs, we have identified persistent high memory usage in the backend application. This document outlines a comprehensive plan to optimize memory usage and improve the overall performance and stability of the system.

## Current Issues

1. **High Memory Usage**: The server logs show persistent high memory usage (above 90% of available memory):
   ```
   [Nest] 424871  - 05/10/2025, 3:00:00 PM   ERROR [MemoryMonitorService] Persistent high memory usage detected for 67 consecutive checks. Service restart recommended.
   ```

2. **Missing Garbage Collection Access**: The application cannot perform manual garbage collection:
   ```
   [Nest] 424871  - 05/10/2025, 3:00:00 PM    WARN [MemoryMonitorService] Manual garbage collection unavailable. Run Node with --expose-gc to enable.
   ```

3. **Frequent Database Queries**: `UserMintingQueueService` is running repeated queries every minute that might be contributing to memory pressure.

## Optimization Strategy

### 1. Immediate Actions

#### Enable Manual Garbage Collection

- Update the Node.js startup command to include `--expose-gc` flag:
  ```bash
  node --expose-gc dist/main.js
  ```

- If using PM2:
  ```bash
  pm2 start dist/main.js --node-args="--expose-gc"
  ```

#### Implement Memory Leak Detection

- Add `heapdump` for on-demand memory snapshots:
  ```bash
  npm install heapdump --save-dev
  ```

- Create an admin endpoint to generate heap snapshots when needed:
  ```typescript
  @Get('admin/heap-snapshot')
  @Roles('admin')
  async generateHeapSnapshot() {
    const heapdump = require('heapdump');
    const filename = `/tmp/heap-${Date.now()}.heapsnapshot`;
    heapdump.writeSnapshot(filename);
    return { message: `Heap snapshot written to ${filename}` };
  }
  ```

### 2. Service Optimizations

#### UserMintingQueueService Optimizations

- Reduce query frequency (currently every minute):
  - Implement exponential backoff if no items are found consistently
  - Add configurable poll interval based on system load

- Optimize query performance:
  - Add appropriate indexes on frequently queried columns
  - Limit returned columns to only those necessary
  - Use connection pooling effectively

#### Memory Leak Prevention

- Implement proper cleanup in services with large data structures:
  - Review and fix closures that may hold references
  - Use WeakMap/WeakSet for cache implementations where appropriate
  - Review event listeners and ensure they're properly removed

- Cache improvements:
  - Add TTL (time to live) to all caches
  - Use LRU (Least Recently Used) caching strategy:
    ```bash
    npm install lru-cache
    ```

### 3. Infrastructure Changes

#### Application Level Improvements

- Implement graceful memory management:
  ```typescript
  // In the MemoryMonitorService
  @Injectable()
  export class MemoryMonitorService {
    private readonly logger = new Logger(MemoryMonitorService.name);
    
    @Interval(60000) // Run every minute
    async checkMemoryUsage() {
      const memoryUsage = process.memoryUsage();
      const usedHeapMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const totalHeapMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const usagePercentage = Math.round((usedHeapMB / totalHeapMB) * 100);
      
      // Log memory usage for monitoring
      this.logger.log(`Memory usage: ${usedHeapMB}MB / ${totalHeapMB}MB (${usagePercentage}%)`);
      
      // If memory usage is high, try to clean up
      if (usagePercentage > 85) {
        this.logger.warn(`High memory usage detected: ${usedHeapMB}MB / ${totalHeapMB}MB (${usagePercentage}%)`);
        
        // Run garbage collection if available
        if (global.gc) {
          this.logger.log('Running manual garbage collection');
          global.gc();
        }
      }
    }
  }
  ```

#### Process Management

- Deploy with PM2 for automatic restarts:
  ```bash
  npm install pm2 -g
  pm2 start ecosystem.config.js
  ```

- Create PM2 ecosystem config with memory limits:
  ```javascript
  // ecosystem.config.js
  module.exports = {
    apps: [{
      name: 'backend',
      script: 'dist/main.js',
      node_args: '--expose-gc',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production'
      },
      watch: false
    }]
  };
  ```

### 4. Monitoring and Analysis

#### Set Up Better Monitoring

- Implement metrics collection with Prometheus:
  ```bash
  npm install @willsoto/nestjs-prometheus prom-client
  ```

- Add memory metrics:
  ```typescript
  @Injectable()
  export class MetricsService {
    private readonly memoryGauge: Gauge;
    
    constructor(private readonly promClientService: PrometheusService) {
      this.memoryGauge = this.promClientService.registerGauge({
        name: 'nodejs_memory_usage_bytes',
        help: 'Memory usage statistics',
        labelNames: ['type']
      });
      
      // Update metrics every 15 seconds
      setInterval(() => this.updateMetrics(), 15000);
    }
    
    private updateMetrics() {
      const memoryUsage = process.memoryUsage();
      this.memoryGauge.set({ type: 'rss' }, memoryUsage.rss);
      this.memoryGauge.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
      this.memoryGauge.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
      this.memoryGauge.set({ type: 'external' }, memoryUsage.external);
    }
  }
  ```

#### Memory Profiling

- Setup periodic memory profiling during development:
  - Use `clinic.js` for memory and performance analysis
  - Install clinic: `npm install clinic -g`
  - Run profiling: `clinic doctor -- node --expose-gc dist/main.js`

### 5. Long-term Architectural Improvements

#### Service Segregation

- Split memory-intensive operations into separate microservices:
  - Move the `UserMintingQueueService` to a dedicated service
  - Use message queues (RabbitMQ or Redis) for communication

#### Database Optimization

- Review and optimize database access patterns:
  - Implement proper pagination for all list APIs
  - Add result limits to all queries
  - Review and optimize all JOIN operations
  - Consider implementing Read/Write segregation

#### Caching Strategy

- Implement a distributed caching layer:
  ```bash
  npm install cache-manager redis
  ```

- Configure the cache module in the app:
  ```typescript
  import { CacheModule } from '@nestjs/cache-manager';
  import { redisStore } from 'cache-manager-redis-store';

  @Module({
    imports: [
      CacheModule.register({
        isGlobal: true,
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 60 * 60 // 1 hour default TTL
      }),
    ],
  })
  export class AppModule {}
  ```

## Implementation Timeline

1. **Week 1: Immediate Actions**
   - Enable manual garbage collection
   - Implement memory leak detection
   - Set up PM2 with proper configuration

2. **Week 2: Service Optimizations**
   - Optimize `UserMintingQueueService`
   - Review and fix potential memory leaks
   - Implement cache improvements

3. **Week 3: Monitoring Setup**
   - Implement Prometheus metrics
   - Set up alerts for memory issues
   - Perform initial memory profiling

4. **Weeks 4-6: Long-term Improvements**
   - Begin service segregation
   - Implement database optimizations
   - Set up distributed caching

## Success Metrics

- Reduce memory usage below 70% of available heap
- Eliminate memory-related restart recommendations
- Improve API response times by 20%
- Reduce database query load by 30%
- Achieve system stability with no memory-related crashes for 30+ days

## Conclusion

This memory optimization plan provides a comprehensive approach to address the current memory usage issues. By implementing these changes, we should significantly improve the stability, scalability, and performance of the application.

Regular monitoring and review of the memory usage patterns will help ensure that these optimizations remain effective and identify any new issues that may arise.