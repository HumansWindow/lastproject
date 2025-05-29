export interface WalletInfo {
  address: string;
  providerType: 'binance' | 'ethereum' | 'other';
}

export interface WalletConnectResponse {
  nonce: string;
  success: boolean;
  message?: string;
  challenge?: string;
}

export interface WalletAuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}
