import { WalletConnection } from './core/connection';
import { MetaMaskProvider } from './providers/ethereum/metamask';
import { WalletConnectAdapter } from './providers/ethereum/walletconnect';
import { WalletAuthenticator } from './auth/wallet-auth';
import { ChallengeManager } from './auth/challenge';
import { WalletProviderType, WalletProvider } from './core/wallet-base';

// RPC configuration for WalletConnect
const RPC_URLS = {
  '1': process.env.NEXT_PUBLIC_ETH_MAINNET_RPC || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  '137': process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
  '56': process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org',
  '43114': process.env.NEXT_PUBLIC_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc',
  '42161': process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  '10': process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io'
};

// API base URL for authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create wallet connection instance
const walletConnection = new WalletConnection();

// Fix the providers object to match the enum
const providers: Partial<Record<WalletProviderType, WalletProvider>> = {
  [WalletProviderType.METAMASK]: new MetaMaskProvider(),
  [WalletProviderType.WALLETCONNECT]: new WalletConnectAdapter({
    1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    56: 'https://bsc-dataseed.binance.org/',
    137: 'https://polygon-rpc.com'
  }),
  // Add placeholder implementations or stub providers for other types
  // [WalletProviderType.COINBASE]: new CoinbaseProvider(), // Not implemented yet
  // [WalletProviderType.TRUST]: new TrustProvider(), // Not implemented yet
  // [WalletProviderType.PHANTOM]: new PhantomProvider(), // Not implemented yet
  // [WalletProviderType.BINANCE]: new BinanceProvider(), // Not implemented yet
};

// Create auth service
const walletAuthenticator = new WalletAuthenticator(API_BASE_URL);

// Create challenge manager
const challengeManager = new ChallengeManager(walletConnection, walletAuthenticator);

// Main wallet service
export const walletService = {
  // Connection methods
  connect: async (providerType: WalletProviderType) => {
    const provider = providers[providerType as keyof typeof providers];
    if (!provider) {
      throw new Error(`Provider ${providerType} is not supported`);
    }
    return await walletConnection.connect(provider);
  },
  
  disconnect: async () => {
    return await walletConnection.disconnect();
  },
  
  isConnected: () => {
    return walletConnection.isConnected();
  },
  
  getWalletInfo: () => {
    return walletConnection.getWalletInfo();
  },
  
  // Authentication methods
  authenticate: async (email?: string) => {
    return await challengeManager.authenticateWithChallenge(email);
  },
  
  refreshToken: async (refreshToken: string) => {
    return await walletAuthenticator.refreshToken(refreshToken);
  },
  
  logout: async (refreshToken: string) => {
    return await walletAuthenticator.logout(refreshToken);
  },
  
  // Event handling
  on: (event: WalletEvent, listener: (...args: any[]) => void) => {
    walletConnection.on(event as WalletEvent, listener);
  },
  
  off: (event: WalletEvent, listener: (...args: any[]) => void) => {
    walletConnection.off(event, listener);
  },
  
  // Network management
  switchNetwork: async (chainId: string, providerType: WalletProviderType) => {
    const provider = providers[providerType as keyof typeof providers];
    if (!provider || !provider.switchNetwork) {
      return false;
    }
    return await provider.switchNetwork(chainId);
  }
};

// Import WalletEvent from core
import { WalletEvent } from './core/wallet-base';

export * from './core/wallet-base';
export * from './auth/wallet-auth';

export default walletService;
