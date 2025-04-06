import { ethers } from 'ethers';
import { Logger } from '@nestjs/common';

interface ProviderHealth {
  url: string;
  isAlive: boolean;
  lastChecked: Date;
  responseTime: number;
  failCount: number;
  lastFailure: Date | null;
  priority: number;
}

interface ProviderOptions {
  url: string;
  priority?: number;
  weight?: number;
}

/**
 * Smart load balancer for blockchain RPC providers
 * Automatically routes requests to healthy providers and handles failover
 */
export class RPCLoadBalancer {
  private readonly logger = new Logger(RPCLoadBalancer.name);
  private readonly providers: Map<string, ethers.providers.JsonRpcProvider> = new Map();
  private readonly healthStatus: Map<string, ProviderHealth> = new Map();
  private readonly priorities: Map<number, string[]> = new Map();
  private readonly healthCheckInterval: NodeJS.Timeout;
  
  // Configuration
  private readonly checkIntervalMs = 30000; // 30 seconds
  private readonly maxFailCount = 3; // Number of consecutive failures before marking as dead
  private readonly recoveryThreshold = 2; // Number of successful checks needed to mark as recovered
  private readonly requestTimeoutMs = 5000; // 5 seconds timeout for requests
  
  constructor(
    private readonly networkName: string,
    private readonly chainId: number,
    private readonly rpcUrls: ProviderOptions[],
  ) {
    if (!rpcUrls || rpcUrls.length === 0) {
      throw new Error(`No RPC URLs provided for network ${networkName} (chainId: ${chainId})`);
    }
    
    // Initialize providers and health status
    for (const option of rpcUrls) {
      const { url, priority = 1, weight = 1 } = option;
      
      // Create provider with timeout
      const provider = new ethers.providers.JsonRpcProvider({
        url,
        timeout: this.requestTimeoutMs,
      });
      
      this.providers.set(url, provider);
      
      // Initialize health status
      this.healthStatus.set(url, {
        url,
        isAlive: true, // Assume alive until proven otherwise
        lastChecked: new Date(),
        responseTime: 0,
        failCount: 0,
        lastFailure: null,
        priority,
      });
      
      // Group by priority
      if (!this.priorities.has(priority)) {
        this.priorities.set(priority, []);
      }
      this.priorities.get(priority).push(url);
    }
    
    // Schedule health checks
    this.healthCheckInterval = setInterval(() => this.checkHealth(), this.checkIntervalMs);
    
    // Run initial health check
    this.checkHealth();
    
    this.logger.log(`Initialized RPC load balancer for ${networkName} (chainId: ${chainId}) with ${rpcUrls.length} providers`);
  }
  
  /**
   * Get the best available provider
   * @returns Best available provider
   * @throws Error if no providers are available
   */
  public getProvider(): ethers.providers.JsonRpcProvider {
    const url = this.selectBestProvider();
    if (!url) {
      throw new Error(`No healthy providers available for ${this.networkName} (chainId: ${this.chainId})`);
    }
    
    return this.providers.get(url);
  }
  
  /**
   * Select the best provider based on priority and health
   * @returns URL of the best provider
   */
  private selectBestProvider(): string | null {
    // Sort priorities (lowest number = highest priority)
    const sortedPriorities = Array.from(this.priorities.keys()).sort((a, b) => a - b);
    
    // Try each priority level
    for (const priority of sortedPriorities) {
      const urls = this.priorities.get(priority);
      const healthyUrls = urls.filter(url => this.healthStatus.get(url).isAlive);
      
      if (healthyUrls.length > 0) {
        // If we have multiple healthy providers at this priority, select one with lowest response time
        return healthyUrls.sort((a, b) => {
          const healthA = this.healthStatus.get(a);
          const healthB = this.healthStatus.get(b);
          return healthA.responseTime - healthB.responseTime;
        })[0];
      }
    }
    
    // If no healthy provider found, try the one with the lowest fail count as a last resort
    const allUrls = Array.from(this.healthStatus.keys());
    if (allUrls.length > 0) {
      return allUrls.sort((a, b) => {
        const healthA = this.healthStatus.get(a);
        const healthB = this.healthStatus.get(b);
        return healthA.failCount - healthB.failCount;
      })[0];
    }
    
    return null;
  }
  
  /**
   * Check health of all providers
   */
  private async checkHealth(): Promise<void> {
    this.logger.debug(`Checking health of ${this.providers.size} providers for ${this.networkName}`);
    
    const checkPromises = Array.from(this.providers.entries()).map(async ([url, provider]) => {
      const health = this.healthStatus.get(url);
      
      try {
        const startTime = Date.now();
        
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), this.requestTimeoutMs);
        });
        
        // Race the block number request against the timeout
        const blockNumber = await Promise.race([
          provider.getBlockNumber(),
          timeoutPromise
        ]);
        
        const responseTime = Date.now() - startTime;
        
        // Update health status
        health.lastChecked = new Date();
        health.responseTime = responseTime;
        
        // If provider was previously marked as dead but now responds, reduce fail count
        if (!health.isAlive) {
          health.failCount = Math.max(0, health.failCount - 1);
          
          // If fail count is below recovery threshold, mark as alive again
          if (health.failCount < this.maxFailCount - this.recoveryThreshold) {
            health.isAlive = true;
            this.logger.log(`Provider ${url} for ${this.networkName} has recovered`);
          }
        } else {
          // Reset fail count for healthy provider
          health.failCount = 0;
        }
        
        this.logger.debug(`Health check success for ${url} (${this.networkName}): blockNumber=${blockNumber}, responseTime=${responseTime}ms`);
        
      } catch (error) {
        // Update health status for failure
        health.lastChecked = new Date();
        health.failCount += 1;
        health.lastFailure = new Date();
        
        if (health.isAlive && health.failCount >= this.maxFailCount) {
          health.isAlive = false;
          this.logger.warn(`Provider ${url} for ${this.networkName} marked as unhealthy after ${health.failCount} consecutive failures`);
        }
        
        this.logger.debug(`Health check failed for ${url} (${this.networkName}): ${error.message}`);
      }
    });
    
    await Promise.allSettled(checkPromises);
    
    // Log summary of provider health
    const healthySummary = Array.from(this.healthStatus.values())
      .filter(h => h.isAlive)
      .map(h => `${h.url.substring(0, 30)}... (${h.responseTime}ms)`);
    
    const unhealthySummary = Array.from(this.healthStatus.values())
      .filter(h => !h.isAlive)
      .map(h => `${h.url.substring(0, 30)}... (failures: ${h.failCount})`);
    
    this.logger.log(
      `${this.networkName} provider health: ${healthySummary.length} healthy, ${unhealthySummary.length} unhealthy`
    );
    
    if (healthySummary.length === 0) {
      this.logger.error(`No healthy providers for ${this.networkName}! All providers are failing.`);
    }
  }
  
  /**
   * Execute a call with automatic failover
   * @param method Method to execute
   * @param args Arguments for the method
   * @returns Result of the method call
   */
  public async executeWithFailover<T>(
    method: (provider: ethers.providers.JsonRpcProvider) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let retryCount = 0;
    let lastError: Error;
    
    // Try each provider in turn until one succeeds or all fail
    while (retryCount < maxRetries) {
      try {
        const provider = this.getProvider();
        return await method(provider);
      } catch (error) {
        lastError = error;
        this.logger.warn(`Provider call failed on ${this.networkName}, retrying (${retryCount + 1}/${maxRetries}): ${error.message}`);
        retryCount++;
        
        // Force a quick health check if we fail
        if (retryCount < maxRetries) {
          await this.checkHealth();
        }
      }
    }
    
    throw new Error(`All providers for ${this.networkName} failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Clear connection pools and any pending requests
    for (const provider of this.providers.values()) {
      if (provider instanceof ethers.providers.JsonRpcProvider) {
        // Make sure to destroy any open connections
        try {
          if (provider.connection) {
            // Connection will be cleaned up by garbage collection
            provider.removeAllListeners();
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
    
    this.providers.clear();
    this.healthStatus.clear();
    this.priorities.clear();
    
    this.logger.log(`Cleaned up RPC load balancer for ${this.networkName}`);
  }
}