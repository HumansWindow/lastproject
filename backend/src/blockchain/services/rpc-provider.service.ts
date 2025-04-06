import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { providers } from 'ethers';
import axios from 'axios';

@Injectable()
export class RpcProviderService {
  private readonly logger = new Logger(RpcProviderService.name);
  private providerCache: Record<string, providers.JsonRpcProvider[]> = {};
  private currentProviderIndex: Record<string, number> = {};
  private lastSwitch: Record<string, number> = {};
  private healthCheckResults: Record<string, boolean[]> = {};

  // Stores all RPC URLs by network
  private rpcUrls: Record<string, string[]> = {
    'ethereum': [
      // Primary URLs (from .env)
      '', // Will be filled from env
      // Backup URLs
      'https://ethereum.publicnode.com',
      'https://rpc.ankr.com/eth/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a',
      'https://eth-mainnet.g.alchemy.com/v2/demo',
      'https://rpc.ankr.com/eth',
      'https://cloudflare-eth.com',
      'https://eth-rpc.gateway.pokt.network',
      'https://eth.api.onfinality.io/public',
      'https://ethereum.blockpi.network/v1/rpc/public'
    ],
    'sepolia': [
      '', // Will be filled from env
      'https://eth-sepolia.public.blastapi.io',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // Public key
    ],
    'polygon': [
      '', // Will be filled from env
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a',
      'https://polygon.llamarpc.com',
      'https://polygon-mainnet.public.blastapi.io',
      'https://poly-rpc.gateway.pokt.network'
    ],
    'polygonAmoy': [
      '', // Will be filled from env
      // Add Chainstack URL as one of the top fallback options for Polygon Amoy
      'https://polygon-amoy.core.chainstack.com/88688593d75804aacdd5dc60e7a1ad5d',
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy.blockpi.network/v1/rpc/public',
      'https://polygon-amoy.public.blastapi.io'
    ],
    'bsc': [
      '', // Will be filled from env
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed4.binance.org'
    ],
    'bscTestnet': [
      '', // Will be filled from env
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-1-s2.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545'
    ],
    'rsk': [
      '', // Will be filled from env
      'https://public-node.rsk.co',
      'https://rsk-mainnet.public.blastapi.io'
    ],
    'rskTestnet': [
      '', // Will be filled from env
      'https://public-node.testnet.rsk.co',
      'https://testnet.rsk.dev'
    ],
    'solanaDevnet': [
      '', // Will be filled from env
      'https://rpc.ankr.com/solana_devnet/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a',
      'https://api.devnet.solana.com'
    ]
  };

  constructor(private configService: ConfigService) {
    this.initializeRpcUrls();
    this.runHealthCheck();
  }

  private initializeRpcUrls(): void {
    // Map environment variables to RPC URLs
    const envMapping = {
      'ethereum': 'ETH_MAINNET_RPC',
      'sepolia': 'ETH_GOERLI_RPC', // Using Sepolia now instead of Goerli
      'polygon': 'POLYGON_MAINNET_RPC',
      'polygonAmoy': 'POLYGON_MUMBAI_RPC', // Using Amoy now instead of Mumbai
      'bsc': 'BSC_MAINNET_RPC',
      'bscTestnet': 'BSC_TESTNET_RPC',
      'rsk': 'RSK_MAINNET_RPC',
      'rskTestnet': 'RSK_TESTNET_RPC',
      // Add Solana if you have it in .env
      'solanaDevnet': 'SOLANA_DEVNET_RPC'
    };

    // Initialize primary URLs from environment variables
    for (const [networkKey, envVar] of Object.entries(envMapping)) {
      const envUrl = this.configService.get<string>(envVar);
      if (envUrl) {
        this.rpcUrls[networkKey][0] = envUrl;
      }
      
      // Remove duplicates and empty entries
      this.rpcUrls[networkKey] = [...new Set(this.rpcUrls[networkKey].filter(url => url))];
      
      // Initialize tracking arrays
      this.currentProviderIndex[networkKey] = 0;
      this.lastSwitch[networkKey] = 0;
      this.healthCheckResults[networkKey] = this.rpcUrls[networkKey].map(() => true);
    }
  }

  async getProvider(network: string): Promise<providers.JsonRpcProvider> {
    if (!this.rpcUrls[network] || this.rpcUrls[network].length === 0) {
      throw new Error(`No RPC URLs configured for network ${network}`);
    }
    
    if (!this.providerCache[network]) {
      this.providerCache[network] = [];
    }
    
    const index = this.currentProviderIndex[network];
    
    // Create provider if not cached
    if (!this.providerCache[network][index]) {
      try {
        const provider = new providers.JsonRpcProvider(this.rpcUrls[network][index]);
        // Force connection initialization
        await provider.ready;
        this.providerCache[network][index] = provider;
      } catch (error) {
        this.logger.error(`Failed to initialize provider for ${network} at ${this.rpcUrls[network][index]}: ${error.message}`);
        // Mark as unhealthy
        this.healthCheckResults[network][index] = false;
        // Try next provider
        return this.switchToNextProvider(network);
      }
    }
    
    return this.providerCache[network][index];
  }

  private async switchToNextProvider(network: string): Promise<providers.JsonRpcProvider> {
    const now = Date.now();
    
    // Only log if it's not too frequent (prevent log spam)
    if (now - this.lastSwitch[network] > 5000) {
      this.logger.log(`Switching RPC provider for ${network} from index ${this.currentProviderIndex[network]}`);
    }
    
    this.lastSwitch[network] = now;
    
    // Find the next healthy provider
    let newIndex = (this.currentProviderIndex[network] + 1) % this.rpcUrls[network].length;
    let attempts = 0;
    
    while (!this.healthCheckResults[network][newIndex] && attempts < this.rpcUrls[network].length) {
      newIndex = (newIndex + 1) % this.rpcUrls[network].length;
      attempts++;
    }
    
    // If we've tried all providers and none are healthy, start over with the first one
    if (attempts === this.rpcUrls[network].length) {
      this.logger.warn(`All RPC providers for ${network} are unhealthy, using the first one anyway`);
      newIndex = 0;
      // Reset all to healthy to try again
      this.healthCheckResults[network] = this.rpcUrls[network].map(() => true);
    }
    
    this.currentProviderIndex[network] = newIndex;
    
    // Try to get the new provider
    return this.getProvider(network);
  }

  // Utility method to check if an RPC endpoint is healthy
  private async isRpcHealthy(url: string): Promise<boolean> {
    try {
      const response = await axios.post(
        url,
        {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        },
        {
          timeout: 3000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return !!(response.data && response.data.result);
    } catch (error) {
      return false;
    }
  }

  // Periodically check RPC health and update status
  private async runHealthCheck(): Promise<void> {
    try {
      for (const network of Object.keys(this.rpcUrls)) {
        for (let i = 0; i < this.rpcUrls[network].length; i++) {
          const url = this.rpcUrls[network][i];
          if (url) {
            const healthy = await this.isRpcHealthy(url);
            this.healthCheckResults[network][i] = healthy;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error during RPC health check: ${error.message}`);
    }
    
    // Run health check every 5 minutes
    setTimeout(() => this.runHealthCheck(), 5 * 60 * 1000);
  }

  // Method to handle failed RPC calls and switch providers if needed
  async executeWithFallback<T>(
    network: string,
    action: (provider: providers.JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = this.rpcUrls[network]?.length || 3;
    
    while (attempts < maxAttempts) {
      try {
        const provider = await this.getProvider(network);
        return await action(provider);
      } catch (error) {
        attempts++;
        
        // Check if error is related to RPC problems
        const isRpcError = this.isRpcRelatedError(error);
        
        if (isRpcError && attempts < maxAttempts) {
          this.logger.warn(`RPC error for ${network}, switching provider and retrying (${attempts}/${maxAttempts}): ${error.message}`);
          await this.switchToNextProvider(network);
          continue;
        }
        
        // If it's the last attempt or not an RPC error, rethrow
        throw error;
      }
    }
    
    throw new Error(`Failed to execute action on ${network} after ${maxAttempts} attempts`);
  }
  
  private isRpcRelatedError(error: any): boolean {
    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';
    
    // Common RPC error patterns
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('econnrefused') ||
      message.includes('failed to fetch') ||
      message.includes('server responded with error') ||
      message.includes('headers timeout') ||
      message.includes('socket hang up') ||
      message.includes('service unavailable') ||
      message.includes('bad gateway') ||
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      code === 'SERVER_ERROR'
    );
  }

  // Get the list of currently active RPCs for monitoring
  getActiveRpcUrls(): Record<string, string> {
    const result = {};
    
    for (const [network, index] of Object.entries(this.currentProviderIndex)) {
      if (this.rpcUrls[network] && this.rpcUrls[network][index]) {
        result[network] = this.rpcUrls[network][index];
      }
    }
    
    return result;
  }
  
  // Get the health status of all RPCs
  getRpcHealthStatus(): Record<string, Record<string, boolean>> {
    const result = {};
    
    for (const network of Object.keys(this.rpcUrls)) {
      result[network] = {};
      
      for (let i = 0; i < this.rpcUrls[network].length; i++) {
        const url = this.rpcUrls[network][i];
        if (url) {
          result[network][url] = this.healthCheckResults[network][i];
        }
      }
    }
    
    return result;
  }
}