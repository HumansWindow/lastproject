import { apiClient } from '../../api-client';

/**
 * Interface for wallet details
 */
export interface Wallet {
  id: string;
  address: string;
  network: string;
  chainId: number;
  label?: string;
  isPrimary: boolean;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
  balances?: {
    native: string;
    formatted: string;
    tokens?: Array<{
      symbol: string;
      address: string;
      balance: string;
      formatted: string;
      decimals: number;
    }>;
  };
}

/**
 * Service for wallet management operations
 */
class WalletService {
  /**
   * Get all user wallets
   * @returns Promise with wallets
   */
  async getUserWallets(): Promise<Wallet[]> {
    try {
      const response = await apiClient.get('/wallets');
      return response.data;
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      throw error;
    }
  }

  /**
   * Get details of a specific wallet
   * @param walletId Wallet ID
   * @returns Promise with wallet details
   */
  async getWalletDetails(walletId: string): Promise<Wallet> {
    try {
      const response = await apiClient.get(`/wallets/${walletId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching wallet details for ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Get wallet by address
   * @param address Wallet address
   * @returns Promise with wallet details
   */
  async getWalletByAddress(address: string): Promise<Wallet> {
    try {
      const response = await apiClient.get(`/wallets/address/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching wallet by address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Create a new wallet
   * @param data Wallet creation data
   * @returns Promise with new wallet
   */
  async createWallet(data?: { label?: string, network?: string }): Promise<Wallet> {
    try {
      const response = await apiClient.post('/wallets', data || {});
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Update a wallet
   * @param walletId Wallet ID
   * @param updates Updates to apply
   * @returns Promise with updated wallet
   */
  async updateWallet(walletId: string, updates: { label?: string }): Promise<Wallet> {
    try {
      const response = await apiClient.put(`/wallets/${walletId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a wallet
   * @param walletId Wallet ID
   * @returns Promise with deletion result
   */
  async deleteWallet(walletId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/wallets/${walletId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Set a wallet as primary
   * @param walletId Wallet ID
   * @returns Promise with updated wallet
   */
  async setPrimaryWallet(walletId: string): Promise<Wallet> {
    try {
      const response = await apiClient.post(`/wallets/${walletId}/primary`);
      return response.data;
    } catch (error) {
      console.error(`Error setting primary wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balances
   * @param walletId Wallet ID
   * @returns Promise with wallet balances
   */
  async getWalletBalances(walletId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/wallets/${walletId}/balances`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching balances for wallet ${walletId}:`, error);
      throw error;
    }
  }

  /**
   * Verify wallet ownership by signing a message
   * @param walletId Wallet ID
   * @returns Promise with verification result
   */
  async verifyWalletOwnership(walletId: string): Promise<any> {
    try {
      // Get the challenge message
      const challengeResponse = await apiClient.get(`/wallets/${walletId}/challenge`);
      const { message } = challengeResponse.data;

      // This would normally use a web3 provider to sign the message
      // For now, we're just mocking it
      console.log(`[Mock] Signing message: ${message}`);
      const signature = `0x${walletId}_mock_signature`;

      // Verify the signature
      const verifyResponse = await apiClient.post(`/wallets/${walletId}/verify`, {
        message,
        signature
      });
      
      return verifyResponse.data;
    } catch (error) {
      console.error(`Error verifying ownership of wallet ${walletId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const walletService = new WalletService();

// Default export
export default walletService;