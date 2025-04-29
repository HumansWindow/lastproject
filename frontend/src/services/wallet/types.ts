export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  chainId?: number;
  error?: string;
}

export enum WalletProviderType {
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  TRUST = 'trust',
  PHANTOM = 'phantom',
  BINANCE = 'binance'
}

export enum WalletEvent {
  CONNECTED = 'connect',
  DISCONNECTED = 'disconnect',
  ACCOUNT_CHANGED = 'accountsChanged',
  CHAIN_CHANGED = 'chainChanged',
  ERROR = 'error'
}

export interface WalletProvider {
  connect(): Promise<WalletConnectionResult>;
  disconnect(): Promise<boolean>;
  isConnected(): boolean;
  // ...other provider methods
}
