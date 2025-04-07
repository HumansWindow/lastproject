// Common types used across the application

// User types
export interface UserInfo {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends UserInfo {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phoneNumber?: string;
  walletAddresses?: string[];
}

export interface UserResponse {
  user: UserInfo;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface WalletAuthResponse extends LoginResponse {
  isNewUser: boolean;
  walletAddress: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

// Notification types
export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  category: string;
  link: string;
  read: boolean;
  userId: string;
  seen: boolean;
}

// Balance types
export interface BalanceChangeEvent {
  address: string;
  previousBalance: string;
  newBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
  type: 'credit' | 'debit';
}

export interface BalanceUpdateEvent {
  previousBalance: string;
  newBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  timestamp: number;
}

// NFT types
export interface NftTransferEvent {
  to: string;
  from: string;
  tokenId: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
  type: 'incoming' | 'outgoing';
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
  };
}

// Adding missing types that were referenced in api.ts

// Diary types
export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  location?: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  images?: string[];
}

export interface DiaryEntryRequest {
  title: string;
  content: string;
  location?: string;
  mood?: string;
  images?: string[];
}

// Wallet types
export interface WalletData {
  id: string;
  address: string;
  chainId: number;
  networkName: string;
  balance: string;
  formattedBalance?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Referral types
export interface ReferralData {
  id: string;
  code: string;
  userId: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Token types
export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  formattedSupply?: string;
  price?: string;
}

export interface NFTItem {
  id: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  networkName: string;
  owner: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TokenPriceEvent {
  previousPrice: string;
  newPrice: string;
  changePercent: number;
  timestamp: number;
}

export interface StakingUpdateEvent {
  positionId: string;
  rewards: string;
  formattedRewards?: string;
  totalStaked: string;
  timestamp: number;
}
