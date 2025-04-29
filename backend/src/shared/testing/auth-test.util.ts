import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import * as crypto from 'crypto';

/**
 * Authentication testing utilities
 * These functions help test authentication flows without needing real wallet signatures
 */
export class AuthTestUtil {
  /**
   * Generate a random Ethereum-like address for testing
   */
  static generateRandomAddress(): string {
    const bytes = crypto.randomBytes(20);
    return '0x' + bytes.toString('hex');
  }

  /**
   * Create a mock wallet login payload for testing
   * @param address Ethereum address (optional, random generated if not provided)
   * @param email Optional email to associate with the wallet
   */
  static createMockWalletLoginPayload(address?: string, email?: string): any {
    const walletAddress = address || this.generateRandomAddress();
    const timestamp = Date.now();
    const domain = process.env.DOMAIN_NAME || 'app.shahi.io';
    const chainId = process.env.DEFAULT_CHAIN_ID || '1';
    const nonce = crypto.randomBytes(16).toString('hex');

    // Create EIP-4361 (Sign-In with Ethereum) compatible message
    const message = 
      `Sign this message to authenticate with ${domain}\n\n` +
      `URI: https://${domain}\n` +
      `Version: 1\n` +
      `Chain ID: ${chainId}\n` +
      `Nonce: ${nonce}\n` +
      `Issued At: ${new Date(timestamp).toISOString()}\n` +
      `Expiration Time: ${new Date(timestamp + 3600000).toISOString()}`;

    // For testing, create a mock signature (65 bytes hex)
    const mockSignature = '0x' + crypto.randomBytes(65).toString('hex').substring(0, 130);
    
    // Ensure address is properly formatted
    const normalizedAddress = walletAddress.toLowerCase();
    if (!normalizedAddress.startsWith('0x')) {
      throw new Error('Wallet address must start with 0x');
    }

    // Create payload matching the expected WalletLoginDto format
    // Return only the exact properties expected by the DTO
    const payload: any = {
      address: normalizedAddress,
      message,
      signature: mockSignature
    };
    
    // Only include email if provided
    if (email) {
      payload.email = email;
    }
    
    return payload;
  }

  /**
   * Extract details from error for better debugging
   */
  static extractErrorDetails(error: any): any {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
        }
      };
    }
    
    return {
      message: error.message || 'Unknown error',
      stack: error.stack,
    };
  }

  /**
   * Test wallet login against the API
   * @param apiBaseUrl Base URL of the API
   * @param address Optional wallet address (random if not provided)
   * @param email Optional email to associate
   */
  static async testWalletLogin(
    apiBaseUrl: string,
    address?: string,
    email?: string
  ): Promise<any> {
    try {
      const payload = this.createMockWalletLoginPayload(address, email);
      
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Request': 'true' // Additional header to identify test requests
        },
        timeout: 10000, // 10 second timeout
      };
      
      console.log('Sending wallet login request with payload:', JSON.stringify(payload, null, 2));
      console.log(`API endpoint: ${apiBaseUrl}/auth/wallet-login`);
      
      const response = await axios.post(`${apiBaseUrl}/auth/wallet-login`, payload, config)
        .catch((error: AxiosError) => {
          // Enhanced error logging
          console.error(`Error response (${error.response?.status || 'unknown'}):`, 
            JSON.stringify(error.response?.data || error.message, null, 2));
          throw error;
        });
      
      return {
        success: response.status < 400,
        data: response.data,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      const errorDetails = this.extractErrorDetails(error);
      console.error('Wallet login test failed with details:', JSON.stringify(errorDetails, null, 2));
      
      return {
        success: false,
        error: errorDetails.data || error.message,
        status: errorDetails.status || error.status,
        statusText: errorDetails.statusText || error.statusText,
        details: errorDetails
      };
    }
  }

  /**
   * Verify an access token is valid by making an authenticated request
   * @param apiBaseUrl Base URL of the API
   * @param accessToken JWT access token to verify
   */
  static async verifyAccessToken(apiBaseUrl: string, accessToken: string): Promise<any> {
    try {
      if (!accessToken) {
        throw new Error('No access token provided for verification');
      }
      
      const config: AxiosRequestConfig = {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Test-Request': 'true'
        },
        timeout: 10000
      };
      
      console.log(`Verifying token: ${accessToken.substring(0, 20)}...`);
      
      // Try to access a protected endpoint (e.g., user profile)
      const response = await axios.get(`${apiBaseUrl}/users/profile`, config)
        .catch((error: AxiosError) => {
          console.error(`Token verification error (${error.response?.status}):`, 
            JSON.stringify(error.response?.data, null, 2));
          throw error;
        });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      const errorDetails = this.extractErrorDetails(error);
      console.error('Token verification failed with details:', JSON.stringify(errorDetails, null, 2));
      
      return {
        success: false,
        error: errorDetails.data || error.message,
        status: errorDetails.status,
        details: errorDetails
      };
    }
  }
}
