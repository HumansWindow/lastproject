import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NFT } from './entities/nft.entity';

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);
  private nftContractAbi: any;

  constructor(
    @InjectRepository(NFT)
    private nftRepository: Repository<NFT>,
    private blockchainService: BlockchainService,
  ) {
    // Load NFT contract ABI
    this.nftContractAbi = [
      /* NFT contract ABI */
    ];
  }

  async mintNft(userId: string, metadata: any) {
    try {
      // Implement NFT minting logic using blockchain service
      // Store NFT details in database

      // Fix: Create NFT with properties that match the entity structure
      const newNft = this.nftRepository.create({
        tokenId: '1', // This exists in the entity
        contractAddress: '0x...', // This exists in the entity
        chainId: 1, // This exists in the entity
        ownerId: userId, // This exists in the entity
        userId: userId, // This exists in the entity
        metadataUri: 'https://example.com/metadata/1', // This exists in the entity
        metadata: metadata, // This exists in the entity as Record<string, any>
        isActive: true, // This exists in the entity
      });

      return await this.nftRepository.save(newNft);
    } catch (error) {
      this.logger.error(`Error minting NFT: ${(error as Error).message}`);
      throw error;
    }
  }

  async getUserNfts(userId: string) {
    return this.nftRepository.find({
      where: { ownerId: userId }, // Changed from userId to ownerId
    });
  }
}
