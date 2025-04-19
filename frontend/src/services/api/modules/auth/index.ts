// Auth module barrel file - imports wallet authentication implementation
export * from '../../../wallet/auth/wallet-auth';

// Create and export authService instance
import { WalletAuthenticator } from '../../../wallet/auth/wallet-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const authService = new WalletAuthenticator(API_BASE_URL);
