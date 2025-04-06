import { ethers } from 'ethers';
import RateLimiter, { ICustomRateLimiter } from '../utils/rateLimiter';

interface GasPrice {
  isEip1559: boolean;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  priorityLevel?: string;
  satPerByte?: string; // Add satPerByte for BTC support
}

interface GasServiceConfig {
  gasPriceMultipliers: {
    slow: number;
    medium: number;
    fast: number;
    urgent: number;
  };
  maxPriorityFeeMultipliers: {
    slow: number;
    medium: number;
    fast: number;
    urgent: number;
  };
  gasLimitBuffer: number;
  gasPriceBufferPercent: number;
  [key: string]: any;
}

/**
 * Service for gas price estimation and optimization
 */
class GasService {
  private chainHandlers: any;
  private providers: { [key: string]: ethers.providers.Provider };
  private config: GasServiceConfig;
  private rateLimiter: ICustomRateLimiter;

  constructor(chainHandlers: any, config: Partial<GasServiceConfig> = {}) {
    this.chainHandlers = chainHandlers;
    
    // Get providers safely - handle both direct access and method call
    this.providers = typeof chainHandlers.getProviders === 'function'
      ? chainHandlers.getProviders()
      : chainHandlers.providers || {};

    // Initialize RateLimiter with required options
    const rateLimiterOptions = {
      maxRequests: 4,  // 4 requests per second
      interval: 1000,  // 1 second interval
      queueEnabled: true,
      maxQueueSize: 1000,
      queueTimeout: 30000,
      errorOnLimit: true,
      dynamicLimits: false
    };

    try {
      // Fix RateLimiter instantiation
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

    this.config = {
      gasPriceMultipliers: {
        slow: 0.9,
        medium: 1.0,
        fast: 1.2,
        urgent: 1.5
      },
      maxPriorityFeeMultipliers: {
        slow: 0.8,
        medium: 1.0,
        fast: 1.5,
        urgent: 2.0
      },
      gasLimitBuffer: 1.1, // Add 10% to estimated gas limit
      gasPriceBufferPercent: 20, // Add 20% to legacy gas price
      ...config
    };
  }
  
  /**
   * Get gas price information for a network
   * @param {string} network - Network identifier
   * @param {string} priorityLevel - Priority level (slow, medium, fast, urgent)
   * @returns {Promise<GasPrice>} Gas price information
   */
  async getGasPrice(network: string, priorityLevel: string = 'medium'): Promise<GasPrice> {
    try {
      const networkUpper = network.toUpperCase();
      
      // Wait for rate limit availability
      await this.rateLimiter.waitForAvailability('gas', 'getPrice');

      const provider = this.providers[networkUpper];
      
      if (!provider) {
        throw new Error(`No provider available for network ${networkUpper}`);
      }
      
      // Get multipliers based on priority level
      const multiplier = this.config.gasPriceMultipliers[priorityLevel] || 1.0;
      const maxPriorityFeeMultiplier = this.config.maxPriorityFeeMultipliers[priorityLevel] || 1.0;
      
      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Try to get EIP-1559 fee data first
        try {
          const feeData = await provider.getFeeData();
          
          // Check if EIP-1559 is supported (maxFeePerGas exists)
          if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            // Apply multipliers for priority level
            const maxFeePerGas = feeData.maxFeePerGas.mul(
              Math.round(multiplier * 100)
            ).div(100);
            
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(
              Math.round(maxPriorityFeeMultiplier * 100)
            ).div(100);
            
            return {
              isEip1559: true,
              gasPrice: feeData.gasPrice.toString(),
              maxFeePerGas: maxFeePerGas.toString(),
              maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
              priorityLevel
            };
          }
        } catch (error) {
          console.warn(`Error getting EIP-1559 fee data for ${networkUpper}:`, error);
          // Fall back to legacy gas price below
        }
        
        // Fall back to legacy gas price
        const gasPrice = await provider.getGasPrice();
        const adjustedGasPrice = gasPrice.mul(
          Math.round(multiplier * 100)
        ).div(100);
        
        return {
          isEip1559: false,
          gasPrice: adjustedGasPrice.toString(),
          priorityLevel
        };
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // Solana uses fixed gas prices
        return {
          isEip1559: false,
          gasPrice: '5000', // Lamports per signature
          priorityLevel
        };
      }
      
      // For Bitcoin (uses fees per byte)
      if (networkUpper === 'BTC') {
        const satPerByte = 20; // Default value
        const adjustedSatPerByte = Math.ceil(satPerByte * multiplier);
        
        return {
          isEip1559: false,
          gasPrice: '0',
          satPerByte: adjustedSatPerByte.toString(),
          priorityLevel
        };
      }
      
      // Default fallback
      return {
        isEip1559: false,
        gasPrice: '0',
        priorityLevel
      };
    } catch (error) {
      console.error(`Error getting gas price for ${network}:`, error);
      const networkUpper = network.toUpperCase();
      // Return reasonable defaults
      return {
        isEip1559: false,
        gasPrice: networkUpper === 'ETH' ? '50000000000' : '5000000000', // 50 gwei for ETH, 5 gwei for others
        priorityLevel
      };
    }
  }
  
  /**
   * Estimate gas for a transaction
   * @param {string} network - Network identifier
   * @param {Object} txParams - Transaction parameters
   * @param {string} priorityLevel - Priority level
   * @returns {Promise<Object>} Gas estimation results
   */
  async estimateGas(network: string, txParams: any, priorityLevel: string = 'medium'): Promise<any> {
    try {
      const networkUpper = network.toUpperCase();
      
      // Wait for rate limit availability
      await this.rateLimiter.waitForAvailability('gas', 'estimate');

      const provider = this.providers[networkUpper];
      
      if (!provider) {
        throw new Error(`No provider available for network ${networkUpper}`);
      }
      
      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Estimate gas limit
        const estimatedGas = await provider.estimateGas(txParams);
        
        // Add buffer for safety
        const gasLimit = estimatedGas.mul(
          Math.round(this.config.gasLimitBuffer * 100)
        ).div(100);
        
        // Get gas price
        const gasPriceData = await this.getGasPrice(networkUpper, priorityLevel);
        
        let gasCost;
        if (gasPriceData.isEip1559) {
          // Use maxFeePerGas for cost estimation (worst case scenario)
          gasCost = ethers.BigNumber.from(gasPriceData.maxFeePerGas).mul(gasLimit);
        } else {
          gasCost = ethers.BigNumber.from(gasPriceData.gasPrice).mul(gasLimit);
        }
        
        return {
          gasLimit: gasLimit.toString(),
          gasPrice: gasPriceData.gasPrice,
          maxFeePerGas: gasPriceData.maxFeePerGas,
          maxPriorityFeePerGas: gasPriceData.maxPriorityFeePerGas,
          gasCost: gasCost.toString(),
          gasCostEther: ethers.utils.formatEther(gasCost),
          network: networkUpper,
          isEip1559: gasPriceData.isEip1559
        };
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // In Solana, gas cost is fixed per signature
        // Default cost is 5000 lamports per signature
        return {
          gasLimit: '1', // One signature
          gasPrice: '5000',
          gasCost: '5000',
          gasCostSOL: '0.000005', // 5000 lamports = 0.000005 SOL
          network: networkUpper
        };
      }
      
      // For Bitcoin
      if (networkUpper === 'BTC') {
        // Bitcoin fees depend on transaction size and fee rate
        // Here we assume a standard transaction size of 250 bytes
        const gasPriceData = await this.getGasPrice(networkUpper, priorityLevel);
        const satPerByte = parseInt(gasPriceData.satPerByte || '20');
        const estimatedSize = 250; // Standard transaction size in bytes
        const gasCost = satPerByte * estimatedSize;
        
        return {
          txSize: estimatedSize.toString(),
          satPerByte: satPerByte.toString(),
          gasCost: gasCost.toString(),
          gasCostBTC: (gasCost / 100000000).toFixed(8), // Convert to BTC
          network: networkUpper
        };
      }
      
      // Default fallback
      return {
        gasLimit: '21000', // Default gas limit for ETH transfer
        gasPrice: '0',
        gasCost: '0',
        gasCostEther: '0',
        network: networkUpper
      };
    } catch (error) {
      console.error(`Error estimating gas for ${network}:`, error);
      const networkUpper = network.toUpperCase();
      // Return reasonable defaults
      return {
        gasLimit: '21000', // Default gas limit for ETH transfer
        gasPrice: networkUpper === 'ETH' ? '50000000000' : '5000000000', // 50 gwei for ETH, 5 gwei for others
        gasCost: '1050000000000000', // 0.00105 ETH
        gasCostEther: '0.00105',
        network: networkUpper,
        isEip1559: false,
        isEstimationFailed: true
      };
    }
  }
  
  /**
   * Get recommended gas price levels
   * @param {string} network - Network identifier
   * @returns {Promise<Object>} Gas price recommendations for different priority levels
   */
  async getGasPriceRecommendations(network: string): Promise<any> {
    try {
      const networkUpper = network.toUpperCase();
      
      // Get gas prices for all priority levels
      const [slow, medium, fast, urgent] = await Promise.all([
        this.getGasPrice(networkUpper, 'slow'),
        this.getGasPrice(networkUpper, 'medium'),
        this.getGasPrice(networkUpper, 'fast'),
        this.getGasPrice(networkUpper, 'urgent')
      ]);
      
      return {
        network: networkUpper,
        recommendations: {
          slow,
          medium,
          fast,
          urgent
        },
        isEip1559: slow.isEip1559
      };
    } catch (error) {
      console.error(`Error getting gas price recommendations for ${network}:`, error);
      return {
        network,
        recommendations: {
          slow: { gasPrice: '0' },
          medium: { gasPrice: '0' },
          fast: { gasPrice: '0' },
          urgent: { gasPrice: '0' }
        },
        isEip1559: false,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate gas cost for a specific amount of gas limit and price
   * @param {string} gasLimit - Gas limit as string
   * @param {string} gasPrice - Gas price in wei as string
   * @returns {Object} Gas cost in wei and native currency
   */
  calculateGasCost(gasLimit: string, gasPrice: string): any {
    try {
      const limit = ethers.BigNumber.from(gasLimit);
      const price = ethers.BigNumber.from(gasPrice);
      const cost = limit.mul(price);
      
      return {
        gasCostWei: cost.toString(),
        gasCostEther: ethers.utils.formatEther(cost)
      };
    } catch (error) {
      console.error('Error calculating gas cost:', error);
      return {
        gasCostWei: '0',
        gasCostEther: '0',
        error: error.message
      };
    }
  }
}

export default GasService;
