import { WalletAuthenticator, AuthChallenge } from './wallet-auth';
import { WalletConnection } from '../core/connection';
import { WalletInfo } from '../core/wallet-base';

export class ChallengeManager {
  private currentChallenge: AuthChallenge | null = null;

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
      this.currentChallenge = await this.authService.getAuthChallenge(walletInfo.address);
      
      if (!this.currentChallenge) {
        return {
          success: false,
          error: 'Failed to receive authentication challenge'
        };
      }
      
      // Create a message for the user to sign
      const messageToSign = `Sign this message to authenticate with our app: ${this.currentChallenge.challenge}`;
      
      // Sign the challenge with wallet
      const signature = await this.walletConnection.signMessage(messageToSign);
      
      if (!signature) {
        return {
          success: false,
          error: 'Failed to sign the challenge'
        };
      }
      
      // Authenticate with the signed challenge and original nonce
      return await this.authService.authenticate(walletInfo, signature, this.currentChallenge.challenge, email);
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Authentication failed'
      };
    } finally {
      // Clear the challenge after authentication attempt
      this.currentChallenge = null;
    }
  }
}
