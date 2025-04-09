// API modules barrel file
export * from './diary';
export * from './user';
export * from './nft';
export * from './realtime';

// Explicitly re-export from auth and wallet to avoid name conflicts
export { authService } from './auth';

// Re-export the type from wallet using export type syntax
export { walletService } from './wallet';
export type { WalletConnectionResult } from './wallet';
