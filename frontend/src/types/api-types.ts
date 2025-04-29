/**
 * API Types
 * This file contains type definitions for API responses and requests.
 * These types are used throughout the application for type-safety and consistency.
 */

// User types
export interface UserInfo {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  walletAddresses?: string[];
  completeLater?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  user: UserInfo;
}

export interface UserSettings {
  id: string;
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacySettings: {
    showProfile: boolean;
    showActivity: boolean;
    showWallet: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  updatedAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
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

// Wallet auth types
export interface WalletConnectRequest {
  address: string;
}

export interface WalletConnectResponse {
  nonce: string;
  walletExists: boolean;
  message?: string; // Optional message/challenge text from the server
}

export interface WalletAuthRequest {
  address: string;
  signature: string;
  nonce: string;
}

export interface WalletAuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
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

export interface NotificationList {
  notifications: NotificationEvent[];
  unreadCount: number;
  total: number;
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

export interface NftMintRequest {
  name: string;
  description: string;
  image: string | File;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  recipientAddress?: string;
}

export interface NftTransferRequest {
  tokenId: string;
  contractAddress: string;
  recipientAddress: string;
}

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
  tags?: string[];
}

export interface DiaryEntryRequest {
  title: string;
  content: string;
  location?: string;
  mood?: string;
  images?: string[];
  tags?: string[];
}

export interface DiaryStats {
  totalEntries: number;
  entriesThisMonth: number;
  entriesLastMonth: number;
  averageMood?: string;
  mostUsedLocation?: string;
}

// Wallet types
export interface WalletInfo {
  address: string;
  chainId?: number;
  networkName?: string;
  balance?: string;
  formattedBalance?: string;
  isConnected?: boolean;
  provider?: string;
}

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
  isDefault?: boolean;
}

export interface WalletTransaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  value: string;
  formattedValue?: string;
  timestamp: number;
  blockNumber: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  networkName: string;
  chainId: number;
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

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: string;
  claimedRewards: string;
  referralLinks: ReferralData[];
}

export interface ReferralHistory {
  id: string;
  referralCode: string;
  referredUserId: string;
  referrerUserId: string;
  status: 'pending' | 'completed' | 'rejected';
  reward?: string;
  createdAt: string;
  completedAt?: string;
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

export interface TokenTransaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  value: string;
  formattedValue?: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  tokenAddress: string;
  tokenSymbol: string;
}

export interface TokenBalanceResponse {
  balance: string;
  formattedBalance: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  usdValue?: string;
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

export interface NFTCollection {
  items: NFTItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TokenPriceEvent {
  previousPrice: string;
  newPrice: string;
  changePercent: number;
  timestamp: number;
}

// Staking types
export interface StakingPosition {
  id: string;
  userId: string;
  amount: string;
  formattedAmount: string;
  rewards: string;
  formattedRewards: string;
  startTime: number;
  lockPeriod: number; // In seconds
  endTime: number;
  isActive: boolean;
  contractAddress: string;
  chainId: number;
  networkName: string;
  apr: string;
  createdAt: string;
  updatedAt: string;
}

export interface StakingCreateRequest {
  amount: string;
  lockPeriod: number; // In seconds
}

export interface StakingUpdateEvent {
  positionId: string;
  rewards: string;
  formattedRewards?: string;
  totalStaked: string;
  timestamp: number;
}

// Blockchain types
export interface BlockchainTransaction {
  hash: string;
  blockNumber?: number;
  confirmations?: number;
  timestamp?: number;
  from: string;
  to: string;
  value: string;
  formattedValue?: string;
  gasUsed?: string;
  gasPrice?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

// Health check types
export interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  uptime: number;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    blockchain: 'up' | 'down';
    cache: 'up' | 'down';
  };
  version: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Common request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}
