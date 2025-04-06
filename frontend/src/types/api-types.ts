/**
 * API Types - Defines TypeScript interfaces for API responses and requests
 */

// Auth types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  verificationRequired: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  referralCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// User types
export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  walletAddress?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  profileImage?: string;
  deviceCount?: number;
}

export interface UserResponse {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  roles?: string[];
}

// Wallet types
export interface WalletData {
  id: string;
  address: string;
  network: string;
  balance: string;
  formattedBalance?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WalletResponse {
  id: string;
  address: string;
  userId: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

// Diary types
export enum DiaryLocation {
  FOREST = 'FOREST',
  CITY = 'CITY',
  BEACH = 'BEACH',
  MOUNTAIN = 'MOUNTAIN',
  DESERT = 'DESERT',
  AQUATIC = 'AQUATIC',
  SPACE = 'SPACE',
  OTHER = 'OTHER'
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  feeling?: string;
  location?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  gameLevel?: number;
  attachments?: {
    type: 'image' | 'audio' | 'video';
    url: string;
  }[];
}

export interface DiaryEntryRequest {
  title: string;
  content: string;
  feeling?: string;
  location?: string;
  color?: string;
  gameLevel?: number;
  attachments?: {
    type: 'image' | 'audio' | 'video';
    url: string;
  }[];
}

export interface DiaryEntryResponse {
  id: string;
  title: string;
  content: string;
  userId: string;
  location?: DiaryLocation;
  feeling?: string;
  gameLevel?: number;
  color?: string;
  hasMedia: boolean;
  isStoredLocally: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiaryEntryRequest {
  title: string;
  content: string;
  location?: DiaryLocation;
  feeling?: string;
  gameLevel?: number;
  color?: string;
  hasMedia?: boolean;
  isStoredLocally?: boolean;
}

export interface UpdateDiaryEntryRequest {
  title?: string;
  content?: string;
  location?: DiaryLocation;
  feeling?: string;
  gameLevel?: number;
  color?: string;
  hasMedia?: boolean;
  isStoredLocally?: boolean;
}

// Referral types
export interface ReferralData {
  code: string;
  userId: string;
  usedCount: number;
  maxUses?: number;
  expiresAt?: string;
  isActive: boolean;
  rewardAmount: string;
  rewardType: 'token' | 'nft' | 'other';
  createdAt: string;
}

export interface ReferralCodeResponse {
  id: string;
  code: string;
  userId: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface ReferralStatsResponse {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  referralCode: ReferralCodeResponse;
}

// NFT types
export interface NFTItem {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  imageUrl?: string;
  attributes?: NFTAttribute[];
  createdAt: string;
  ownerAddress: string;
  network: string;
  transactionHash?: string;
  metadata: Record<string, any>;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTResponse {
  id: string;
  tokenId: string;
  contractAddress: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NFTMintRequest {
  name: string;
  description: string;
  image?: string;
  metadata?: Record<string, any>;
}

// Token types
export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo?: string;
  price?: string;
  balance?: string;
  formattedBalance?: string;
  network: string;
}

export interface TokenInfoResponse {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  contractAddress: string;
}

export interface TokenBalanceResponse {
  balance: string;
  formattedBalance: string;
  usdValue?: string;
}

export interface TokenStatsResponse {
  circulatingSupply: string;
  totalBurned: string;
  totalMinted: string;
  holders: number;
}

// Staking types
export interface ApyTier {
  id: string;
  name: string;
  lockPeriodDays: number;
  apy: number;
  isActive: boolean;
  minAmount: string;
  priority: number;
}

export interface StakingPosition {
  id: string;
  userId: string;
  walletAddress: string;
  amount: string;
  lockPeriodDays: number;
  apy: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn';
  accruedRewards: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStakingRequest {
  amount: string;
  lockPeriodDays: number;
}

export interface WithdrawStakingRequest {
  positionId: string;
}

export interface ClaimRewardsRequest {
  positionId: string;
}

// WebSocket event types
export enum WebSocketEventType {
  BALANCE_CHANGE = 'balance-change',
  NFT_TRANSFER = 'nft-transfer',
  TOKEN_PRICE = 'token-price',
  STAKING_UPDATE = 'staking-update',
  NOTIFICATION = 'notification'
}

export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  timestamp: number;
}

export interface BalanceChangeEvent extends BaseWebSocketEvent {
  address: string;
  previousBalance: string;
  newBalance: string;
  formattedPreviousBalance?: string;
  formattedNewBalance?: string;
  txHash?: string;
  blockNumber: number;
  chainId: number;
  networkName: string;
}

export interface NftTransferEvent extends BaseWebSocketEvent {
  tokenId: string;
  contractAddress: string;
  from: string;
  to: string;
  txHash: string;
  blockNumber: number;
  chainId: number;
  networkName: string;
  metadata?: {
    name?: string;
    image?: string;
    description?: string;
  };
}

export interface TokenPriceEvent extends BaseWebSocketEvent {
  symbol: string;
  price: number;
  previousPrice: number;
  change24h: number;
  changePercent24h: number;
  volume24h?: number;
  marketCap?: number;
}

export interface StakingUpdateEvent extends BaseWebSocketEvent {
  positionId: string;
  userId: string;
  walletAddress: string;
  rewards: string; // String representation of BigNumber
  formattedRewards: string; // Human readable format
  apy: number;
  daysRemaining: number;
}

export interface NotificationEvent extends BaseWebSocketEvent {
  userId: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: Record<string, any>;
}

export interface WebSocketConnectionEvent extends BaseWebSocketEvent {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  attempt?: number;
  maxAttempts?: number;
  nextRetry?: number;
  error?: string;
}

export interface WebSocketAuthEvent extends BaseWebSocketEvent {
  status: 'success' | 'error' | 'expired';
  userId?: string;
  error?: string;
}