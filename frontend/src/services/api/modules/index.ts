// API modules barrel file
export * from "./diary";
export * from "./user";
export * from "./nft";
export * from "./realtime";

// Explicitly re-export from auth and wallet to avoid name conflicts
export { authService } from "./auth";

// Fix the import syntax
import walletService from "../../../services/wallet/walletService";
export { walletService };
export type { WalletConnectionResult } from "../../../services/wallet/types";
