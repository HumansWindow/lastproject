// Common interfaces for wallet functionality
export interface WalletInfo {
  address: string;
  chainId: number;
  name?: string;
  isConnected?: boolean;
  provider?: any;
}

export interface WalletAuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
  isNewUser?: boolean;
}
