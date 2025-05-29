/**
 * @deprecated Please import from 'services/api/auth' instead
 * This file is maintained for backward compatibility
 */

import { walletAuthService } from '../../../services/api/modules/auth';
import { WalletInfo } from '../core/walletBase';
export { walletAuthService };

// Interface definitions to fix TypeScript errors
export interface AuthChallenge {
  challenge: string;
  expiresAt?: string;
  nonce?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

export interface WalletAuthenticator {
  getAuthChallenge(address: string): Promise<AuthChallenge>;
  authenticate(
    walletInfo: WalletInfo,
    signature: string,
    challenge: string,
    email?: string,
    deviceId?: string
  ): Promise<AuthResult>;
  disconnect(): void;
}

// Re-export the wallet methods from the unified auth service for backward compatibility
import { unifiedAuthService } from '../../../services/api/modules/auth';
export const walletAuth = {
  getChallenge: (address: string) => unifiedAuthService.wallet.getChallenge(address),
  authenticate: unifiedAuthService.wallet.authenticate,
  disconnect: unifiedAuthService.logout // Use the main logout function since disconnect doesn't exist in the wallet namespace
};

export default walletAuth;
