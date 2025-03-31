import { ethers } from 'ethers';
import { apiClient } from '../services/api'; // Correct import path

// Add this type declaration for ethereum in the global window object
declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Service class for wallet authentication
 * Handles connecting wallet, requesting challenge, signing, and authenticating with backend
 */
class WalletAuthService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private accountsChangedListeners: Set<(accounts: string[]) => void> = new Set();
  private chainChangedListeners: Set<(chainId: string) => void> = new Set();
  
  constructor() {
    // Set max listeners to prevent warnings
    if (typeof window !== 'undefined' && window.ethereum) {
      if (window.ethereum.setMaxListeners) {
        window.ethereum.setMaxListeners(100); // Increase max listeners
      }
    }
  }
  
  // Check if wallet is available in the browser
  isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }
  
  // Connect to user's wallet and return the address
  async connectWallet(): Promise<string | null> {
    try {
      if (!this.isWalletAvailable()) {
        console.error('No Ethereum wallet found in browser');
        return null;
      }
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Get the connected wallet address
      const address = await this.signer.getAddress();
      console.log('Wallet connected:', address);
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  }
  
  // First step: Connect wallet and request challenge from backend
  async initiateWalletConnection(address: string): Promise<{ exists: boolean; challenge: string }> {
    try {
      console.log('Initiating wallet connection for:', address);
      // Make sure to use the connect endpoint
      const response = await apiClient.post('/auth/wallet/connect', { address });
      console.log('Challenge received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initiating wallet connection:', error);
      throw error;
    }
  }
  
  // Second step: Sign the challenge and authenticate
  async authenticateWithSignature(address: string, challenge: string, email?: string): Promise<any> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Signing challenge:', challenge);
      const signature = await this.signer.signMessage(challenge);
      console.log('Signature created:', signature);
      
      console.log('Authenticating with signature');
      // Step 2: Send the address, message (challenge), signature, and optionally email
      const requestData: {
        address: string;
        message: string;
        signature: string;
        email?: string;
      } = {
        address: address,
        message: challenge,
        signature: signature
      };
      
      // Only add email if provided (completely optional)
      if (email) {
        console.log('Including optional email in authentication request');
        requestData.email = email;
      }
      
      // Log detailed request data for debugging
      console.log('Authentication request payload:', {
        address: requestData.address,
        message: requestData.message,
        messageLength: requestData.message.length,
        signature: requestData.signature,
        signatureLength: requestData.signature.length,
        hasEmail: !!requestData.email
      });
      
      // Set proper headers
      const config = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Make sure we're using the authenticate endpoint
      const response = await apiClient.post('/auth/wallet/authenticate', requestData, config);
      console.log('Authentication response:', response.data);
      
      // Store tokens if authentication successful
      if (response.data.accessToken) {
        localStorage.setItem('access_token', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refresh_token', response.data.refreshToken);
        }
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error authenticating with signature:', error);
      // Add more detailed error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }
  
  // Complete wallet authentication flow
  async authenticate(email?: string): Promise<any> {
    try {
      // Connect wallet and get address
      const address = await this.connectWallet();
      if (!address) {
        throw new Error('Failed to connect wallet');
      }
      
      console.log('Connected wallet address:', address);
      
      // Step 1: Get challenge from backend
      console.log('Requesting challenge from backend...');
      const connectResponse = await this.initiateWalletConnection(address);
      if (!connectResponse || !connectResponse.challenge) {
        throw new Error('Failed to get challenge from server');
      }
      console.log('Received challenge:', connectResponse.challenge);
      
      // Step 2: Sign the challenge with wallet
      console.log('Signing challenge...');
      if (!this.signer) {
        throw new Error('No signer available');
      }
      const signature = await this.signer.signMessage(connectResponse.challenge);
      console.log('Challenge signed successfully');
      
      // Step 3: Send signature back to authenticate
      console.log('Submitting signature for authentication...');
      
      // Prepare authentication data
      const authData: {
        address: string;
        message: string;
        signature: string;
        email?: string;
      } = {
        address,
        message: connectResponse.challenge,
        signature,
      };
      
      // Only add email if provided AND it's valid
      // Otherwise, we can authenticate with just the wallet
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        authData.email = email;
      } else if (email) {
        console.warn('Email format is invalid, proceeding with wallet-only authentication');
      } else {
        console.log('No email provided, proceeding with wallet-only authentication');
      }
      
      // Full logging of request data
      console.log('Full authentication request data:', {
        address: authData.address,
        challenge: authData.message,
        signature: authData.signature.substring(0, 30) + '...',
        hasEmail: !!authData.email
      });
      
      // Set explicit content type header
      const config = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Use the authenticate endpoint (not the connect endpoint)
      const authResponse = await apiClient.post('/auth/wallet/authenticate', authData, config);
      console.log('Authentication successful');
      
      // Store tokens if authentication successful
      if (authResponse.data.accessToken) {
        localStorage.setItem('access_token', authResponse.data.accessToken);
        if (authResponse.data.refreshToken) {
          localStorage.setItem('refresh_token', authResponse.data.refreshToken);
        }
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authResponse.data.accessToken}`;
      }
      
      return authResponse.data;
    } catch (error: any) {
      console.error('Wallet authentication failed:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Check if there's a specific error message from the server
        if (error.response.data && error.response.data.message) {
          console.error('Server error message:', error.response.data.message);
        }
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error during request setup:', error.message);
      }
      
      throw error;
    }
  }
  
  // Disconnect wallet
  disconnect(): void {
    // Clean up event listeners when disconnecting
    if (this.isWalletAvailable()) {
      this.accountsChangedListeners.forEach(listener => {
        window.ethereum.removeListener('accountsChanged', listener);
      });
      this.chainChangedListeners.forEach(listener => {
        window.ethereum.removeListener('chainChanged', listener);
      });
      this.accountsChangedListeners.clear();
      this.chainChangedListeners.clear();
    }
    
    this.provider = null;
    this.signer = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
  
  // Get current wallet address
  async getCurrentAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        return null;
      }
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }
  
  // Listen for account changes
  setupAccountChangeListener(callback: (accounts: string[]) => void): () => void {
    if (this.isWalletAvailable()) {
      // Remove previous instances of the same callback if any
      window.ethereum.removeListener('accountsChanged', callback);
      
      // Add the listener
      window.ethereum.on('accountsChanged', callback);
      this.accountsChangedListeners.add(callback);
      
      // Return cleanup function
      return () => {
        window.ethereum.removeListener('accountsChanged', callback);
        this.accountsChangedListeners.delete(callback);
      };
    }
    return () => {};
  }
  
  // Listen for chain changes
  setupChainChangeListener(callback: (chainId: string) => void): () => void {
    if (this.isWalletAvailable()) {
      // Remove previous instances of the same callback if any
      window.ethereum.removeListener('chainChanged', callback);
      
      // Add the listener
      window.ethereum.on('chainChanged', callback);
      this.chainChangedListeners.add(callback);
      
      // Return cleanup function
      return () => {
        window.ethereum.removeListener('chainChanged', callback);
        this.chainChangedListeners.delete(callback);
      };
    }
    return () => {};
  }
}

// Create and export a singleton instance
export const walletAuthService = new WalletAuthService();
