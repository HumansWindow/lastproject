import { ChainHandlers } from './handlers/ChainHandlers';

// Export as ES module with default export
const config = {
  // RPC endpoints
  ETH_RPC_URL:
    process.env.ETH_RPC_URL || 'wss://mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  BNB_RPC_URL:
    process.env.BNB_RPC_URL ||
    'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
  SOL_RPC_URL:
    process.env.SOL_RPC_URL ||
    'https://api.mainnet-beta.solana.com',
  MATIC_RPC_URL:
    process.env.MATIC_RPC_URL ||
    'wss://polygon-mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',

  // Security settings
  encryptPrivateKeys: true,
  encryptionKey: process.env.WALLET_ENCRYPTION_KEY || 'change-this-in-production',

  // Persistence settings
  persistWallets: false,
  walletStoragePath: process.env.WALLET_STORAGE_PATH || '/path/to/secure/storage',

  // Token settings
  includeTokens: true,

  // Gas settings
  defaultGasLimit: {
    ETH: '21000',
    BNB: '21000',
    MATIC: '21000',
  },

  // Fee settings
  defaultPriorityFee: {
    ETH: '1.5',
    BNB: '5',
    MATIC: '30',
  },

  // Token list - will be populated from ChainHandlers
  tokens: {},
};

export default config;

/**
 * HotWallet configuration
 */
module.exports = {
  // RPC Endpoints for different chains
  rpcEndpoints: {
    ETH: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
    BNB: process.env.BNB_RPC_URL || 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
    SOL: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
    MATIC: process.env.MATIC_RPC_URL || 'https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
  },
  
  // Security settings
  security: {
    encryptPrivateKeys: true,
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-for-development',
    mnemonicStrength: 256,
  },
  
  // Transaction defaults
  transactions: {
    defaultGasLimit: 21000,
    defaultGas: {
      slow: { wait: '10min', price: 'low' },
      medium: { wait: '3min', price: 'average' },
      fast: { wait: '1min', price: 'high' },
      urgent: { wait: '30sec', price: 'highest' },
    }
  },
  
  // Default HD path for derivation
  derivationPath: {
    ETH: "m/44'/60'/0'/0/",
    BNB: "m/44'/60'/0'/0/",
    SOL: "m/44'/501'/0'/0/",
    MATIC: "m/44'/60'/0'/0/",
  },
  
  // Monitor settings
  monitor: {
    pollingInterval: 15000, // 15 seconds
    pendingTxTimeout: 7200000, // 2 hours
  }
};
