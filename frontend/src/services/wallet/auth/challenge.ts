import { WalletAuthenticator, AuthChallenge } from "../auth/walletAuth";
import { WalletConnection } from "../core/connection";
import { WalletInfo, BlockchainType } from "../core/walletBase";
import { DEFAULT_BLOCKCHAIN_NETWORK } from "../../../config/blockchain/constants";

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

      // Ensure wallet has blockchain info, fallback to Polygon if not specified
      const enrichedWalletInfo: WalletInfo = {
        ...walletInfo,
        blockchain: walletInfo.blockchain || DEFAULT_BLOCKCHAIN_NETWORK
      };
      
      // Log the network being used for authentication
      console.log(`Authenticating with wallet on network: ${enrichedWalletInfo.blockchain}`);
      
      // Get challenge from backend
      this.currentChallenge = await this.authService.getAuthChallenge(enrichedWalletInfo.address);
      
      if (!this.currentChallenge) {
        return {
          success: false,
          error: 'Failed to receive authentication challenge'
        };
      }
      
      // IMPORTANT: Do not modify the challenge message - pass it directly to signing
      // Trust Wallet requires the exact challenge string that the backend expects
      const messageToSign = this.currentChallenge.challenge;
      
      // Log the challenge to help with debugging
      console.log(`Challenge received from server (first 30 chars): ${messageToSign.substring(0, 30)}...`);
      
      // Sign the challenge with wallet
      const signature = await this.walletConnection.signMessage(messageToSign);
      
      if (!signature) {
        return {
          success: false,
          error: 'Failed to sign the challenge'
        };
      }
      
      // Authenticate with the signed challenge and original nonce
      return await this.authService.authenticate(enrichedWalletInfo, signature, this.currentChallenge.challenge, email);
      
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
