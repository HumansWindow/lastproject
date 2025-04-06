export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
}
