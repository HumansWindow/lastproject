// API modules barrel file
export * from './diary';
export * from './user';
export * from './nft';
export * from './realtime';

// Explicitly re-export from auth and wallet to avoid name conflicts
export { authService } from './auth';

// Import from new wallet service location instead
export { walletService } from '../../../services/wallet';
export type { WalletConnectionResult } from '../../../services/wallet/types';
