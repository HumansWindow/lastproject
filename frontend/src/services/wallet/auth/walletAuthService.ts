/**
 * @deprecated This file contains a mock implementation for testing purposes only.
 * For production code, please import from 'services/api/modules/auth' instead.
 * 
 * This mock wallet authentication service exists only for unit tests and will be 
 * removed or relocated to a test directory in the future.
 */

export interface WalletChallenge {
  id: string;
  message: string;
  expiresAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
  userId?: string;
  success?: boolean;
  error?: string;
}

class WalletAuthService {
  /**
   * Request a challenge for wallet authentication
   */
  public async requestChallenge(walletAddress: string, blockchain?: string): Promise<WalletChallenge> {
    console.log(`Mock: Requesting challenge for ${walletAddress} on ${blockchain}`);
    return {
      id: 'mock-challenge-id',
      message: `Sign this message to verify ownership of ${walletAddress} at timestamp ${Date.now()}`
    };
  }

  /**
   * Authenticate using a wallet signature
   */
  public async authenticate(request: any): Promise<AuthResponse> {
    console.log('Mock: Authenticating with signature', request);
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user-id', address: request.address },
      success: true
    };
  }
}

export const walletAuthService = new WalletAuthService();
export default walletAuthService;