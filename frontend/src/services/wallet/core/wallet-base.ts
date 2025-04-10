export enum WalletProviderType {
  METAMASK = 'metamask',
  COINBASE = 'coinbase',
  WALLETCONNECT = 'walletconnect',
  TRUST = 'trust',
  PHANTOM = 'phantom',
  BINANCE = 'binance'
}

export enum BlockchainType {
  ETHEREUM = 'ethereum',
  BINANCE = 'binance',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism'
}

export interface WalletInfo {
  address: string;
  chainId: string;
  blockchain: BlockchainType;
  providerType: WalletProviderType;
}

export interface WalletConnectionResult {
  success: boolean;
  walletInfo?: WalletInfo;
  error?: string;
  provider?: any; // The actual provider instance
}

export interface SignMessageResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface WalletProvider {
  connect(): Promise<WalletConnectionResult>;
  disconnect(): Promise<boolean>;
  signMessage(message: string, address: string): Promise<SignMessageResult>;
  switchNetwork?(chainId: string): Promise<boolean>;
  isConnected(): boolean;
  getProvider(): any;
}

export interface WalletEventEmitter {
  on(event: WalletEvent, listener: (...args: any[]) => void): void;
  off(event: WalletEvent, listener: (...args: any[]) => void): void;
  emit(event: WalletEvent, ...args: any[]): void;
}

export enum WalletEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ACCOUNT_CHANGED = 'accountChanged',
  CHAIN_CHANGED = 'chainChanged',
  ERROR = 'error'
}
