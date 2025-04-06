import { apiClient } from './api-client';

/**
 * Interface for referral statistics
 */
export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  referralEarnings: string;
  formattedReferralEarnings: string;
  referralCode?: string;
  referralCodeActive?: boolean;
}

/**
 * Interface for referral details
 */
export interface Referral {
  id: string;
  code: string;
  referrerId: string;
  referredId: string;
  status: 'active' | 'pending' | 'expired' | 'rejected';
  rewardsPaid: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/**
 * Error response interface
 */
interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

/**
 * Service for referral system functionality
 */
class ReferralService {
  /**
   * Get referral statistics for the current user
   * @returns Promise with referral stats
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const response = await apiClient.get('/referrals/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      throw error;
    }
  }

  /**
   * Generate a new referral code
   * @returns Promise with referral code
   */
  async generateReferralCode(): Promise<{ code: string }> {
    try {
      const response = await apiClient.post('/referrals/code/generate');
      return response.data;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  /**
   * Toggle the active state of the user's referral code
   * @param active Whether the code should be active
   * @returns Promise with updated state
   */
  async toggleReferralCode(active: boolean): Promise<{ active: boolean }> {
    try {
      const response = await apiClient.post('/referrals/code/toggle', { active });
      return response.data;
    } catch (error) {
      console.error('Error toggling referral code status:', error);
      throw error;
    }
  }

  /**
   * Get a referral by code
   * @param code Referral code
   * @returns Promise with referral details
   */
  async getReferralByCode(code: string): Promise<Referral> {
    try {
      const response = await apiClient.get(`/referrals/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting referral details for code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Validate a referral code
   * @param code Referral code to validate
   * @returns Promise with validation result
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/referrals/validate', { code });
      return response.data;
    } catch (error: unknown) {
      console.error('Error validating referral code:', error);
      
      // If it's an HTTP error, structure a proper response
      const typedError = error as ErrorResponse;
      if (typedError.response?.data?.message) {
        return {
          valid: false,
          message: typedError.response.data.message
        };
      }
      
      // Generic error
      return { valid: false, message: 'Failed to validate referral code' };
    }
  }

  /**
   * Apply a referral code to the current user
   * @param code Referral code to apply
   * @returns Promise with application result
   */
  async applyReferralCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/referrals/apply', { code });
      return {
        success: true,
        message: response.data.message || 'Referral code applied successfully'
      };
    } catch (error: unknown) {
      console.error('Error applying referral code:', error);
      
      // If it's an HTTP error, structure a proper response
      const typedError = error as ErrorResponse;
      if (typedError.response?.data?.message) {
        return {
          success: false,
          message: typedError.response.data.message
        };
      }
      
      // Generic error
      return {
        success: false,
        message: 'Failed to apply referral code'
      };
    }
  }

  /**
   * Get list of referrals made by the current user
   * @param page Page number
   * @param limit Results per page
   * @returns Promise with paginated referrals
   */
  async getUserReferrals(page = 1, limit = 10): Promise<{
    data: Referral[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const response = await apiClient.get('/referrals/made', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user referrals:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const referralService = new ReferralService();

// Default export
export default referralService;