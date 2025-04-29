import { ethers } from 'ethers';
import { WalletProviderType, BlockchainType, WalletInfo, WalletConnectionResult, SignMessageResult } from '../../core/wallet-base';

export class TrustWalletProvider {
  private provider: any;
  private ethereum: any;
  private connected: boolean = false;
  private address: string | null = null;
  
  constructor() {
    // Safe window access pattern to prevent errors during SSR or when extension isn't available
    if (typeof window !== 'undefined') {
      this.ethereum = window.ethereum;
    }
  }

  async connect(): Promise<WalletConnectionResult> {
    try {
      // If Trust Wallet isn't installed, throw an error
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'Trust Wallet is not installed'
        };
      }

      // Initialize the provider safely with defensive checks
      let provider;
      
      try {
        // Try to safely get the Trust Wallet provider
        if (this.ethereum && this.ethereum.isTrust) {
          provider = this.ethereum;
        } else if (window.ethereum && window.ethereum.providers) {
          // Handle the case when there are multiple providers
          provider = window.ethereum.providers.find((p: any) => p.isTrust);
        }
      } catch (err) {
        console.warn('Error detecting Trust Wallet provider:', err);
      }

      if (!provider) {
        return {
          success: false,
          error: 'Trust Wallet provider not found'
        };
      }

      this.provider = new ethers.providers.Web3Provider(provider);
      
      try {
        // Request account access
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          this.connected = true;
          this.address = accounts[0];
          
          // Get the network to determine chainId
          const networkInfo = await this.provider.getNetwork();
          const chainId = '0x' + networkInfo.chainId.toString(16);
          
          const walletInfo: WalletInfo = {
            address: accounts[0],
            chainId: chainId,
            provider: this.provider,
            blockchain: BlockchainType.ETHEREUM,
            providerType: WalletProviderType.TRUST
          };
          
          return {
            success: true,
            walletInfo,
            provider: this.provider
          };
        } else {
          return {
            success: false,
            error: 'No accounts found'
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to connect to Trust Wallet: ${error.message}`
        };
      }
    } catch (error: any) {
      console.error('Trust Wallet connection error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error connecting to Trust Wallet'
      };
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      // Trust Wallet doesn't have a disconnect method in its API
      // Just clear local state
      this.provider = null;
      this.address = null;
      this.connected = false;
      return true;
    } catch (error) {
      console.error('Error disconnecting from Trust Wallet:', error);
      return false;
    }
  }

  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    try {
      if (!this.provider) {
        throw new Error('Not connected to Trust Wallet');
      }
      
      const signer = this.provider.getSigner();
      const signature = await signer.signMessage(message);
      
      return {
        success: true,
        signature
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to sign message with Trust Wallet: ${error.message}`
      };
    }
  }

  isConnected(): boolean {
    return this.connected && !!this.address;
  }

  getProvider(): any {
    return this.provider;
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // Check if Trust Wallet is available
      return Boolean(
        (window.ethereum && window.ethereum.isTrust) || 
        (window.ethereum && window.ethereum.providers && 
          window.ethereum.providers.some((p: any) => p.isTrust))
      );
    } catch (error) {
      console.warn('Error checking Trust Wallet installation:', error);
      return false;
    }
  }
  
  // Optionally implement switchNetwork if needed
  async switchNetwork(chainId: string): Promise<boolean> {
    try {
      await this.provider.send('wallet_switchEthereumChain', [{ chainId }]);
      return true;
    } catch (error) {
      console.error('Error switching network in Trust Wallet:', error);
      return false;
    }
  }
}