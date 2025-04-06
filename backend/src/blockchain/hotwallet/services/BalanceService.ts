import circuitBreaker from '../utils/circuitBreaker';
import { RateLimiter, ICustomRateLimiter } from '../utils/rateLimiter';
import ChainHandlers from '../handlers/ChainHandlers';

interface BalanceServiceConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number;
  [key: string]: any;
}

interface CacheEntry {
  balance: string;
  timestamp: number;
}

interface BalanceCache {
  native: { [key: string]: CacheEntry };
  tokens: { [key: string]: CacheEntry };
}

/**
 * Service for fetching cryptocurrency balances across different networks
 */
class BalanceService {
  private chainHandlers: ChainHandlers;
  private config: BalanceServiceConfig;
  private balanceCache: BalanceCache;
  private rateLimiter: ICustomRateLimiter;

  /**
   * Create a new BalanceService
   * @param {ChainHandlers} chainHandlers - Chain handlers for different networks
   * @param {Object} config - Configuration options
   */
  constructor(chainHandlers: ChainHandlers, config: BalanceServiceConfig = {}) {
    this.chainHandlers = chainHandlers;
    this.config = {
      cacheEnabled: true,
      cacheTTL: 30000, // 30 seconds cache time
      ...config
    };
    
    // Simple cache for balance lookups
    this.balanceCache = {
      native: {}, // Format: network:address -> {balance, timestamp}
      tokens: {}  // Format: token:address -> {balance, timestamp}
    };

    // Initialize RateLimiter with configuration
    try {
      this.rateLimiter = new RateLimiter({
        maxRequests: 10,
        interval: 1000,
        queueEnabled: true,
        maxQueueSize: 1000,
        queueTimeout: 30000,
        errorOnLimit: true,
        dynamicLimits: false
      });
    } catch (error) {
      console.error('Failed to initialize RateLimiter:', error);
      // Fallback to dummy rate limiter
      this.rateLimiter = {
        waitForAvailability: async () => {},
        destroy: () => {}
      };
    }
  }
  
  /**
   * Get native currency balance with caching and error handling
   * @param {string} address - Wallet address
   * @param {string} network - Network identifier
   * @returns {Promise<string>} Balance in native units
   */
  async getBalance(address: string, network: string): Promise<string> {
    try {
      if (!address || !network) {
        throw new Error('Address and network are required');
      }
      
      const networkUpper = network.toUpperCase();
      const cacheKey = `${networkUpper}:${address}`;
      
      // Check cache first if enabled
      if (this.config.cacheEnabled) {
        const cachedBalance = this._getFromCache('native', cacheKey);
        if (cachedBalance) return cachedBalance;
      }
      
      // Apply rate limiting before making the request
      await this.rateLimiter.waitForAvailability(networkUpper, 'getBalance');
      
      // Use circuit breaker for resilience
      const balance = await circuitBreaker.execute(
        `${networkUpper}_getBalance`,
        async () => {
          const handler = this.chainHandlers.getHandler(networkUpper);
          if (!handler) throw new Error(`No handler found for network: ${networkUpper}`);
          return await handler.getBalance(address);
        },
        async (error) => {
          console.warn(`Circuit breaker fallback for ${networkUpper} balance:`, error?.message || error);
          return '0.0';
        }
      );
      
      // Update cache
      if (this.config.cacheEnabled) {
        this._setCache('native', cacheKey, balance);
      }
      
      return balance;
    } catch (error) {
      console.error(`Error getting ${network} balance for ${address}:`, error.message);
      return '0.0';
    }
  }
  
  /**
   * Get token balance with caching and error handling
   * @param {string} address - Wallet address
   * @param {string} token - Token identifier (e.g., ETH_USDT, MATIC_USDC)
   * @returns {Promise<string>} Token balance
   */
  async getTokenBalance(address: string, token: string): Promise<string> {
    try {
      if (!address || !token) {
        throw new Error('Address and token are required');
      }
      
      const cacheKey = `${token}:${address}`;
      
      // Check cache first if enabled
      if (this.config.cacheEnabled) {
        const cachedBalance = this._getFromCache('tokens', cacheKey);
        if (cachedBalance) return cachedBalance;
      }
      
      // Get the network from the token identifier
      const network = token.split('_')[0] || token;
      
      // Apply rate limiting before making the request
      await this.rateLimiter.waitForAvailability(network, 'getTokenBalance');
      
      // Use circuit breaker for resilience
      const balance = await circuitBreaker.execute(
        `${token}_getBalance`,
        async () => {
          const handler = this.chainHandlers.getHandler(token);
          if (!handler || !handler.getBalance) {
            throw new Error(`No handler found for token: ${token}`);
          }
          return await handler.getBalance(address);
        },
        async (error) => {
          console.warn(`Circuit breaker fallback for ${token} balance:`, error?.message || error);
          return '0.0';
        }
      );
      
      // Update cache
      if (this.config.cacheEnabled) {
        this._setCache('tokens', cacheKey, balance);
      }
      
      return balance;
    } catch (error) {
      console.error(`Error getting ${token} balance for ${address}:`, error.message);
      return '0.0';
    }
  }
  
  /**
   * Get token decimals for a given token
   * @param {string} token - Token identifier
   * @returns {Promise<number>} Token decimals
   */
  async getTokenDecimals(token: string): Promise<number> {
    try {
      if (!token) {
        throw new Error('Token identifier is required');
      }
      
      // Check if token info exists in chainHandlers
      const tokens = this.chainHandlers.tokens || {};
      if (tokens[token]) {
        return tokens[token].decimals || 18;
      }
      
      // Try to get from token handler
      const handler = this.chainHandlers.getHandler(token);
      if (handler && handler.getDecimals) {
        return await handler.getDecimals();
      }
      
      // Default to 18 decimals (most common)
      return 18;
    } catch (error) {
      console.error(`Error getting token decimals for ${token}:`, error.message);
      return 18;
    }
  }
  
  /**
   * Get token symbol from a token identifier
   * @param {string} token - Token identifier
   * @returns {Promise<string>} Token symbol
   */
  async getTokenSymbol(token: string): Promise<string> {
    try {
      if (!token) {
        throw new Error('Token identifier is required');
      }
      
      // If the token is in the format NETWORK_SYMBOL
      if (token.includes('_')) {
        return token.split('_')[1];
      }
      
      // Try to get from token handler
      const handler = this.chainHandlers.getHandler(token);
      if (handler && handler.getSymbol) {
        return await handler.getSymbol();
      }
      
      return token;
    } catch (error) {
      console.error(`Error getting token symbol for ${token}:`, error.message);
      return token;
    }
  }
  
  /**
   * Get account balances across multiple tokens
   * @param {string} address - Wallet address
   * @param {string[]} tokens - Array of token identifiers
   * @returns {Promise<Object>} Map of token to balance
   */
  async getMultipleBalances(address: string, tokens: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    await Promise.all(tokens.map(async (token) => {
      try {
        if (token.includes('_')) {
          // Token balance
          results[token] = await this.getTokenBalance(address, token);
        } else {
          // Native balance
          results[token] = await this.getBalance(address, token);
        }
      } catch (error) {
        console.error(`Error getting balance for ${token}:`, error);
        results[token] = '0.0';
      }
    }));
    
    return results;
  }
  
  /**
   * Invalidate cache entries for an address
   * @param {string} address - Wallet address
   * @param {string} [network] - Optional network to limit invalidation
   * @param {string} [token] - Optional token to invalidate
   */
  invalidateCache(address: string, network?: string | null, token?: string | null): void {
    if (!this.config.cacheEnabled) return;
    
    // Helper to delete matching keys
    const deleteMatchingKeys = (cache: { [key: string]: CacheEntry }, pattern: string) => {
      Object.keys(cache)
        .filter(key => key.includes(pattern))
        .forEach(key => delete cache[key]);
    };
    
    if (token) {
      // Invalidate specific token balance
      delete this.balanceCache.tokens[`${token}:${address}`];
    } else if (network) {
      // Invalidate all balances for a network
      deleteMatchingKeys(this.balanceCache.native, `${network.toUpperCase()}:${address}`);
      // Also invalidate tokens for that network
      const networkPrefix = `${network.toUpperCase()}_`;
      Object.keys(this.balanceCache.tokens)
        .filter(key => key.startsWith(networkPrefix) && key.includes(address))
        .forEach(key => delete this.balanceCache.tokens[key]);
    } else {
      // Invalidate all balances for an address
      deleteMatchingKeys(this.balanceCache.native, `:${address}`);
      deleteMatchingKeys(this.balanceCache.tokens, `:${address}`);
    }
  }
  
  /**
   * Clear all cached balances
   */
  clearCache(): void {
    this.balanceCache = {
      native: {},
      tokens: {}
    };
  }
  
  /**
   * Get a value from cache if valid
   * @private
   */
  private _getFromCache(type: 'native' | 'tokens', key: string): string | null {
    const cache = this.balanceCache[type];
    const entry = cache[key];
    
    if (!entry) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.config.cacheTTL) {
      delete cache[key];
      return null;
    }
    
    return entry.balance;
  }

  /**
   * Set a value in cache
   * @private
   */
  private _setCache(type: 'native' | 'tokens', key: string, balance: string): void {
    this.balanceCache[type][key] = {
      balance,
      timestamp: Date.now()
    };
  }
}

export default BalanceService;
