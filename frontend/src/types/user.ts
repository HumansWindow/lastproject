export interface User {
  id: string;
  email?: string;
  walletAddress?: string; // Added the walletAddress property
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
}
