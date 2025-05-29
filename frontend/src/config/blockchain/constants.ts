/**
 * Blockchain Constants
 * 
 * This file standardizes blockchain configuration across the application
 * with Polygon as the default network.
 */
import { BlockchainType } from "../../services/wallet/core/walletBase";

// Default blockchain network - standardized to Polygon
export const DEFAULT_BLOCKCHAIN_NETWORK: BlockchainType = BlockchainType.POLYGON;

// Supported blockchain networks in order of preference
export const SUPPORTED_NETWORKS: BlockchainType[] = [
  BlockchainType.POLYGON, // Primary network
  BlockchainType.ETHEREUM, // Secondary/fallback network
  BlockchainType.BINANCE,
  BlockchainType.AVALANCHE,
  BlockchainType.ARBITRUM,
  BlockchainType.OPTIMISM,
  BlockchainType.SOLANA,
  BlockchainType.TON
];

// Chain IDs for supported networks
export const CHAIN_IDS = {
  [BlockchainType.POLYGON]: '0x89', // 137 in decimal
  [BlockchainType.ETHEREUM]: '0x1', // 1 in decimal
  [BlockchainType.BINANCE]: '0x38', // 56 in decimal
  [BlockchainType.AVALANCHE]: '0xa86a', // 43114 in decimal
  [BlockchainType.ARBITRUM]: '0xa4b1', // 42161 in decimal
  [BlockchainType.OPTIMISM]: '0xa', // 10 in decimal
  // Note: SOLANA and TON don't use EVM chain IDs
};

// RPC URLs for supported networks
export const RPC_URLS = {
  [BlockchainType.POLYGON]: 'https://polygon-rpc.com',
  [BlockchainType.ETHEREUM]: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  [BlockchainType.BINANCE]: 'https://bsc-dataseed.binance.org',
  [BlockchainType.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
  [BlockchainType.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  [BlockchainType.OPTIMISM]: 'https://mainnet.optimism.io',
};

// Network metadata for adding networks to wallets
export const NETWORK_METADATA = {
  [BlockchainType.POLYGON]: {
    chainId: CHAIN_IDS[BlockchainType.POLYGON],
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [RPC_URLS[BlockchainType.POLYGON]],
    blockExplorerUrls: ['https://polygonscan.com/']
  },
  [BlockchainType.ETHEREUM]: {
    chainId: CHAIN_IDS[BlockchainType.ETHEREUM],
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [RPC_URLS[BlockchainType.ETHEREUM]],
    blockExplorerUrls: ['https://etherscan.io/']
  },
  // Add other networks as needed
};

/**
 * Normalizes a blockchain type string
 * @param type Blockchain type from any source
 * @returns Normalized blockchain type, defaulting to Polygon if not recognized
 */
export const normalizeBlockchainType = (type: string | undefined): BlockchainType => {
  if (!type) {
    return DEFAULT_BLOCKCHAIN_NETWORK;
  }

  const normalized = type.toLowerCase();
  
  // Special case handling for Trust Wallet which might report "ethereum" even on Polygon
  if (normalized === 'ethereum') {
    // If we're on chain ID 137, it's actually Polygon
    if (typeof window !== 'undefined' && window?.ethereum?.chainId === CHAIN_IDS[BlockchainType.POLYGON]) {
      return BlockchainType.POLYGON;
    }
  }

  // Check if it's a valid blockchain type
  const validType = Object.values(BlockchainType).find(
    (val) => val.toLowerCase() === normalized
  );

  return validType || DEFAULT_BLOCKCHAIN_NETWORK;
};

/**
 * Switch to Polygon Network
 * @param provider Ethereum provider
 * @returns Promise that resolves to true if successful
 */
export const switchToPolygonNetwork = async (provider: any): Promise<boolean> => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_IDS[BlockchainType.POLYGON] }],
    });
    return true;
  } catch (error: any) {
    // Chain not added to wallet
    if (error.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_METADATA[BlockchainType.POLYGON]]
        });
        return true;
      } catch (addError) {
        console.error('Error adding Polygon network', addError);
        return false;
      }
    }
    console.error('Error switching to Polygon network', error);
    return false;
  }
};

/**
 * Check if network is Polygon
 * @param chainId Chain ID to check
 * @returns True if the chain ID is Polygon
 */
export const isPolygonNetwork = (chainId?: string): boolean => {
  return chainId === CHAIN_IDS[BlockchainType.POLYGON];
};

const blockchainConstants = {
  DEFAULT_BLOCKCHAIN_NETWORK,
  SUPPORTED_NETWORKS,
  CHAIN_IDS,
  RPC_URLS,
  NETWORK_METADATA,
  normalizeBlockchainType,
  switchToPolygonNetwork,
  isPolygonNetwork
};

export default blockchainConstants;