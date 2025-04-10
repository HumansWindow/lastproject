import { ethers } from 'ethers';
import {
  BlockchainType,
  SignMessageResult,
  WalletConnectionResult,
  WalletInfo,
  WalletProvider,
  WalletProviderType
} from '../../core/wallet-base';

// Add window ethereum type declaration at the top
declare global {
  interface Window {
    ethereum?: any;
  }
}

export class MetaMaskProvider implements WalletProvider {
  private provider: any = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private chainId: string | null = null;
  
  constructor() {
    this.checkForProvider();
  }
  
  private checkForProvider(): boolean {
    // Check if window.ethereum exists
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = window.ethereum;
      return true;
    }
    return false;
  }
  
  async connect(): Promise<WalletConnectionResult> {
    if (!this.checkForProvider()) {
      return {
        success: false,
        error: 'MetaMask is not installed'
      };
    }
    
    try {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found'
        };
      }
      
      // Get the connected address and chain ID
      const address = accounts[0];
      const { chainId } = await ethersProvider.getNetwork();
      
      this.address = address;
      this.chainId = chainId.toString();
      this.signer = ethersProvider.getSigner();
      
      const walletInfo: WalletInfo = {
        address,
        chainId: chainId.toString(),
        blockchain: this.getBlockchainType(chainId.toString()),
        providerType: WalletProviderType.METAMASK
      };
      
      return {
        success: true,
        walletInfo,
        provider: this.provider
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Failed to connect to MetaMask'
      };
    }
  }
  
  async disconnect(): Promise<boolean> {
    // MetaMask doesn't support programmatic disconnection
    // We'll just clear our local state
    this.signer = null;
    this.address = null;
    this.chainId = null;
    return true;
  }
  
  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    if (!this.signer) {
      return {
        success: false,
        error: 'Not connected to MetaMask'
      };
    }
    
    try {
      const signature = await this.signer.signMessage(message);
      return {
        success: true,
        signature
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Failed to sign message'
      };
    }
  }
  
  isConnected(): boolean {
    return !!this.signer && !!this.address;
  }
  
  getProvider(): any {
    return this.provider;
  }
  
  async switchNetwork(chainId: string): Promise<boolean> {
    if (!this.provider) return false;
    
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private getBlockchainType(chainId: string): BlockchainType {
    // Map chainId to BlockchainType
    const chainIdMap: Record<string, BlockchainType> = {
      '1': BlockchainType.ETHEREUM,
      '56': BlockchainType.BINANCE,
      '137': BlockchainType.POLYGON,
      '43114': BlockchainType.AVALANCHE,
      '42161': BlockchainType.ARBITRUM,
      '10': BlockchainType.OPTIMISM,
    };
    
    return chainIdMap[chainId] || BlockchainType.ETHEREUM;
  }
}
