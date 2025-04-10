import { WalletAuthenticator } from './wallet-auth';
import { WalletConnection } from '../core/connection';
import { WalletInfo } from '../core/wallet-base';

export class ChallengeManager {
  constructor(
    private walletConnection: WalletConnection,
    private authService: WalletAuthenticator
  ) {}
  
  async authenticateWithChallenge(email?: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    userId?: string;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      const walletInfo = this.walletConnection.getWalletInfo();
      
      if (!walletInfo) {
        return {
          success: false,
          error: 'No wallet connected'
        };
      }
      
      // Get challenge from backend
      const challenge = await this.authService.getAuthChallenge(walletInfo.address);
      
      // Sign the challenge with wallet
      const signature = await this.walletConnection.signMessage(challenge);
      
      if (!signature) {
        return {
          success: false,
          error: 'Failed to sign the challenge'
        };
      }
      
      // Authenticate with the signed challenge
      return await this.authService.authenticate(walletInfo, signature, email);
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Authentication failed'
      };
    }
  }
}
