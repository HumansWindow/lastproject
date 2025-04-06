import { apiClient } from './api-client';

/**
 * Interface for NFT basic information
 */
export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  imageUrl?: string;
  ownerAddress: string;
  creatorAddress: string;
  chainId: number;
  network: string;
  tokenStandard: 'ERC721' | 'ERC1155';
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for detailed NFT information
 */
export interface DetailedNFT extends NFT {
  metadata: Record<string, any>;
  attributes?: Array<{
    traitType: string;
    value: string | number;
    displayType?: string;
  }>;
  royaltyInfo?: {
    percentage: number;
    recipient: string;
  };
  transactionHistory?: Array<{
    id: string;
    transactionHash: string;
    fromAddress: string;
    toAddress: string;
    timestamp: string;
    eventType: 'mint' | 'transfer' | 'sale';
    price?: string;
  }>;
}

/**
 * Interface for NFT minting request
 */
export interface NFTMintRequest {
  name: string;
  description?: string;
  image?: File | string;
  imageUrl?: string;
  attributes?: Array<{
    traitType: string;
    value: string | number;
    displayType?: string;
  }>;
  royaltyPercentage?: number;
  royaltyRecipient?: string;
  tokenStandard?: 'ERC721' | 'ERC1155';
  supply?: number; // For ERC1155 tokens
  recipientAddress?: string; // If different from minter
  metadata?: Record<string, any>; // Additional custom metadata
}

/**
 * Service for NFT management
 */
class NFTService {
  /**
   * Get all NFTs owned by the user
   * @param page Page number
   * @param limit Results per page
   * @returns Promise with paginated NFTs
   */
  async getUserNFTs(page = 1, limit = 20): Promise<{
    data: NFT[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const response = await apiClient.get('/nfts', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific NFT
   * @param nftId NFT ID
   * @returns Promise with NFT details
   */
  async getNFTDetails(nftId: string): Promise<DetailedNFT> {
    try {
      const response = await apiClient.get(`/nfts/${nftId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching NFT details for ${nftId}:`, error);
      throw error;
    }
  }

  /**
   * Get an NFT by contract address and token ID
   * @param contractAddress Contract address
   * @param tokenId Token ID
   * @returns Promise with NFT details
   */
  async getNFTByContractAndToken(
    contractAddress: string,
    tokenId: string
  ): Promise<DetailedNFT> {
    try {
      const response = await apiClient.get(`/nfts/token`, {
        params: { contractAddress, tokenId }
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching NFT with contract ${contractAddress} and token ID ${tokenId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Mint a new NFT
   * @param nftData NFT minting data
   * @returns Promise with minted NFT
   */
  async mintNFT(nftData: NFTMintRequest): Promise<DetailedNFT> {
    try {
      // Handle file uploads if needed
      if (nftData.image instanceof File) {
        const formData = new FormData();
        
        // Add the image file
        formData.append('image', nftData.image);
        
        // Add other data as JSON
        const { image, ...restData } = nftData;
        formData.append('data', JSON.stringify(restData));
        
        const response = await apiClient.post('/nfts/mint', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Regular JSON request
        const response = await apiClient.post('/nfts/mint', nftData);
        return response.data;
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Transfer an NFT to another address
   * @param nftId NFT ID
   * @param toAddress Recipient address
   * @returns Promise with transfer result
   */
  async transferNFT(nftId: string, toAddress: string): Promise<any> {
    try {
      const response = await apiClient.post(`/nfts/${nftId}/transfer`, {
        toAddress
      });
      return response.data;
    } catch (error) {
      console.error(`Error transferring NFT ${nftId}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction history for an NFT
   * @param nftId NFT ID
   * @returns Promise with transaction history
   */
  async getNFTHistory(nftId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/nfts/${nftId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for NFT ${nftId}:`, error);
      throw error;
    }
  }

  /**
   * Get NFT collections owned by the user
   * @returns Promise with collections
   */
  async getUserCollections(): Promise<any> {
    try {
      const response = await apiClient.get('/nfts/collections');
      return response.data;
    } catch (error) {
      console.error('Error fetching user collections:', error);
      throw error;
    }
  }

  /**
   * Verify authenticity of an NFT
   * @param nftId NFT ID
   * @returns Promise with verification result
   */
  async verifyNFT(nftId: string): Promise<{
    authentic: boolean;
    message: string;
    provenance?: Array<{
      timestamp: string;
      event: string;
      address: string;
      transactionHash?: string;
    }>;
  }> {
    try {
      const response = await apiClient.get(`/nfts/${nftId}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying NFT ${nftId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const nftService = new NFTService();

// Default export
export default nftService;