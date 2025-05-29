/**
 * Wallet information interface
 */
export interface WalletInfo {
  address: string;
  chainId: number;
  chainType?: string;
  providerType?: string;
  isConnected?: boolean;
}

/**
 * Blockchain type enum
 */
export enum BlockchainType {
  ETHEREUM = 'ethereum',
  BINANCE = 'binance',
  SOLANA = 'solana',
  POLYGON = 'polygon'
}

/**
 * Wallet provider type enum
 */
export enum WalletProviderType {
  METAMASK = 'metamask',
  BINANCE = 'binance',
  TRUST = 'trust',
  WALLET_CONNECT = 'walletconnect'
}
