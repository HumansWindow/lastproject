/**
 * Default blockchain configuration values
 * This file centralizes all default RPC URLs and other blockchain configuration
 * to ensure consistency across the application
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load blockchain-specific environment variables
const blockchainEnvPath = path.resolve(__dirname, '..', 'hotwallet', '.env');
if (fs.existsSync(blockchainEnvPath)) {
  dotenv.config({ path: blockchainEnvPath });
}

/**
 * Interface defining blockchain configuration properties
 */
export interface BlockchainConfig {
  ETH_RPC_URL: string;
  BNB_RPC_URL: string;
  SOL_RPC_URL: string;
  MATIC_RPC_URL: string;
  ETH?: string;
  BNB?: string;
  SOL?: string;
  MATIC?: string;
  TOKEN_CONTRACT_ADDRESS?: string;
  encryptPrivateKeys?: boolean;
  [key: string]: any; // Allow for additional properties
}

export const DEFAULT_RPC_URLS = {
  ETH_RPC_URL: 'https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
  BNB_RPC_URL: 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
  SOL_RPC_URL: 'https://mainnet.helius-rpc.com/?api-key=77ab1854-d2c4-4c8b-a682-dc32234ad17f',
  MATIC_RPC_URL: 'https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
  // Also provide WebSocket URLs where applicable
  ETH_WS_URL: 'wss://mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  MATIC_WS_URL: 'wss://polygon-mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  // Default token contract address (for development environments only)
  TOKEN_CONTRACT_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Replace with a valid test contract
};

// Export a single static reference to prevent multiple configurations
let GLOBAL_CONFIG: BlockchainConfig | null = null;

/**
 * Creates a complete blockchain configuration object with all required properties
 * @param config Optional partial configuration that will override defaults
 * @returns Complete configuration with all required properties
 */
export function createBlockchainConfig(config?: Record<string, any>): BlockchainConfig {
  // If config is already created and no new config is provided, return the global config
  if (GLOBAL_CONFIG && !config) {
    return GLOBAL_CONFIG;
  }
  
  const safeConfig = config || {};
  
  // Ensure we get values from environment variables first, then config
  const envConfig = {
    ETH_RPC_URL: process.env.ETH_RPC_URL,
    BNB_RPC_URL: process.env.BNB_RPC_URL, 
    SOL_RPC_URL: process.env.SOL_RPC_URL,
    MATIC_RPC_URL: process.env.MATIC_RPC_URL,
    TOKEN_CONTRACT_ADDRESS: process.env.TOKEN_CONTRACT_ADDRESS
  };
  
  // Start with defaults
  const result: BlockchainConfig = {
    ETH_RPC_URL: envConfig.ETH_RPC_URL || DEFAULT_RPC_URLS.ETH_RPC_URL,
    BNB_RPC_URL: envConfig.BNB_RPC_URL || DEFAULT_RPC_URLS.BNB_RPC_URL,
    SOL_RPC_URL: envConfig.SOL_RPC_URL || DEFAULT_RPC_URLS.SOL_RPC_URL,
    MATIC_RPC_URL: envConfig.MATIC_RPC_URL || DEFAULT_RPC_URLS.MATIC_RPC_URL,
    // Token contract address
    TOKEN_CONTRACT_ADDRESS: envConfig.TOKEN_CONTRACT_ADDRESS || DEFAULT_RPC_URLS.TOKEN_CONTRACT_ADDRESS,
    // Shorthand versions
    ETH: envConfig.ETH_RPC_URL || DEFAULT_RPC_URLS.ETH_RPC_URL,
    BNB: envConfig.BNB_RPC_URL || DEFAULT_RPC_URLS.BNB_RPC_URL,
    SOL: envConfig.SOL_RPC_URL || DEFAULT_RPC_URLS.SOL_RPC_URL,
    MATIC: envConfig.MATIC_RPC_URL || DEFAULT_RPC_URLS.MATIC_RPC_URL,
    // Other common properties
    encryptPrivateKeys: false
  };
  
  // Override with input config values if present
  if (safeConfig.ETH_RPC_URL || safeConfig.ETH) {
    result.ETH_RPC_URL = safeConfig.ETH_RPC_URL || safeConfig.ETH || result.ETH_RPC_URL;
    result.ETH = result.ETH_RPC_URL;
  }
  
  if (safeConfig.BNB_RPC_URL || safeConfig.BNB) {
    result.BNB_RPC_URL = safeConfig.BNB_RPC_URL || safeConfig.BNB || result.BNB_RPC_URL;
    result.BNB = result.BNB_RPC_URL;
  }
  
  if (safeConfig.SOL_RPC_URL || safeConfig.SOL) {
    result.SOL_RPC_URL = safeConfig.SOL_RPC_URL || safeConfig.SOL || result.SOL_RPC_URL;
    result.SOL = result.SOL_RPC_URL;
  }
  
  if (safeConfig.MATIC_RPC_URL || safeConfig.MATIC) {
    result.MATIC_RPC_URL = safeConfig.MATIC_RPC_URL || safeConfig.MATIC || result.MATIC_RPC_URL;
    result.MATIC = result.MATIC_RPC_URL;
  }
  
  // Set token contract address
  if (safeConfig.TOKEN_CONTRACT_ADDRESS) {
    result.TOKEN_CONTRACT_ADDRESS = safeConfig.TOKEN_CONTRACT_ADDRESS;
  }
  
  // Add any other properties from the input config
  Object.keys(safeConfig).forEach(key => {
    if (!result.hasOwnProperty(key)) {
      result[key] = safeConfig[key];
    }
  });
  
  // Store as global config for future reference
  GLOBAL_CONFIG = result;
  
  return result;
}

// Create default instance of config
createBlockchainConfig();

/**
 * Get the global blockchain config
 * This is useful when you need to access the configuration but can't use dependency injection
 */
export function getBlockchainConfig(): BlockchainConfig {
  if (!GLOBAL_CONFIG) {
    GLOBAL_CONFIG = createBlockchainConfig();
  }
  return GLOBAL_CONFIG;
}
