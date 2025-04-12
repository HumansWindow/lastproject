/**
 * Wallet Service
 * 
 * This service handles wallet connection and authentication
 */
import { apiClient } from '@/services/api/api-client';
import { WalletAuthResponse, WalletConnectResponse } from '@/types/api-types';

export class WalletService {
  /**
   * Connect wallet to get a nonce for signing
   * @param address The wallet address
   * @returns A nonce that needs to be signed
   */
  static async connectWallet(address: string): Promise<WalletConnectResponse> {
    try {
      console.log('Connecting wallet:', address);
      const response = await apiClient.post('/auth/wallet/connect', { address });
      return response.data;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Authenticate with signature
   * @param address Wallet address
   * @param signature Signed nonce
   * @param nonce Nonce that was signed
   * @returns Authentication response with tokens
   */
  static async authenticateWallet(
    address: string,
    signature: string,
    nonce: string
  ): Promise<WalletAuthResponse> {
    try {
      console.log('Authenticating wallet:', { address, nonce });
      const response = await apiClient.post('/auth/wallet/authenticate', {
        address,
        signature,
        nonce,
      });

      // Store auth data
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('walletAddress', address);

      return response.data;
    } catch (error) {
      console.error('Error authenticating wallet:', error);
      throw error;
    }
  }

  /**
   * Sign a message with wallet
   * @param message The message to sign
   * @returns Signature
   */
  static async signMessage(message: string): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet provider found');
    }
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      // Sign the message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Complete wallet connection and authentication flow
   * @returns Authentication response
   */
  static async connectAndAuthenticate(): Promise<WalletAuthResponse> {
    try {
      // Request account access
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet provider found');
      }
      
      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      
      // Connect to get nonce
      const { nonce } = await this.connectWallet(address);
      
      // Sign the nonce
      const message = `Sign this message to authenticate with our app: ${nonce}`;
      const signature = await this.signMessage(message);
      
      // Authenticate with signature
      return await this.authenticateWallet(address, signature, nonce);
    } catch (error) {
      console.error('Wallet connection flow failed:', error);
      throw error;
    }
  }
}

// Fix for the declaration issue
// Instead of redeclaring window.ethereum which causes the conflict,
// we'll extend the global Window interface
declare global {
  interface Window {
    ethereum?: any; // Using any type to avoid conflicts with other declarations
  }
}

export default WalletService;
