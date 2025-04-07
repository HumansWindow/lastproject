import { apiClient } from '../../api-client';

/**
 * Service for token-related operations
 */
class TokenService {
  /**
   * Get token balance for the current user
   * @returns Promise with token balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await apiClient.get('/token/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw error;
    }
  }

  /**
   * Mint tokens for first-time users
   * @returns Promise with minting result
   */
  async mintFirstTime(): Promise<any> {
    try {
      const response = await apiClient.post('/token/mint/first-time');
      return response.data;
    } catch (error) {
      console.error('Error minting first-time tokens:', error);
      throw error;
    }
  }

  /**
   * Mint annual tokens
   * @returns Promise with minting result
   */
  async mintAnnual(): Promise<any> {
    try {
      const response = await apiClient.post('/token/mint/annual');
      return response.data;
    } catch (error) {
      console.error('Error minting annual tokens:', error);
      throw error;
    }
  }

  /**
   * Get token information
   * @returns Promise with token info
   */
  async getTokenInfo(): Promise<any> {
    try {
      const response = await apiClient.get('/token/info');
      return response.data;
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw error;
    }
  }

  /**
   * Get token statistics
   * @returns Promise with token stats
   */
  async getTokenStats(): Promise<any> {
    try {
      const response = await apiClient.get('/token/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching token stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const tokenService = new TokenService();

// Default export
export default tokenService;