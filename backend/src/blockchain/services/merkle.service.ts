import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { User } from '../../users/entities/user.entity';
import { ShahiTokenService } from './shahi-token.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MerkleService implements OnModuleInit {
  private readonly logger = new Logger(MerkleService.name);
  private merkleTree: MerkleTree | null = null;
  private leaves: string[] = [];
  private addressToLeafIndex: Map<string, number> = new Map();
  private initialized = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly shahiTokenService: ShahiTokenService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeFromDatabase();
  }

  /**
   * Initialize merkle tree with wallet addresses from the database
   */
  async initializeFromDatabase() {
    try {
      // Find all verified wallet addresses
      const users = await this.userRepository.find({
        select: ['walletAddress'],
        where: { 
          walletAddress: Not(IsNull()),
          isVerified: true 
        }
      });

      const walletAddresses = users
        .map(user => user.walletAddress)
        .filter(Boolean) as string[];

      this.logger.log(`Initializing merkle tree with ${walletAddresses.length} wallet addresses from database`);
      
      // Initialize the merkle tree with validated addresses
      this.initializeMerkleTree(walletAddresses);
      this.initialized = true;
      
      // Optionally update the contract's merkle root if configured to do so
      if (this.configService.get<boolean>('UPDATE_MERKLE_ROOT_ON_BOOT') === true) {
        try {
          const merkleRoot = this.getRoot();
          this.logger.log(`Updating contract merkle root to: ${merkleRoot}`);
          // Use the ShahiTokenService to update the merkle root in the contract
          // This depends on your implementation of shahiTokenService
        } catch (error) {
          this.logger.error(`Failed to update contract merkle root: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to initialize merkle tree from database: ${error.message}`, error.stack);
    }
  }

  /**
   * Validate if a string is a valid Ethereum address
   * @param address Address to validate
   * @returns True if the address is valid
   */
  private isValidEthereumAddress(address: string): boolean {
    try {
      if (!address || typeof address !== 'string') return false;
      
      // Check if address matches the Ethereum address pattern (0x followed by 40 hex chars)
      if (!address.match(/^0x[0-9a-fA-F]{40}$/)) return false;
      
      // Try to normalize the address using ethers.js
      const normalized = ethers.utils.getAddress(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize the merkle tree with a list of eligible addresses
   * @param addresses List of eligible addresses
   */
  initializeMerkleTree(addresses: string[]): void {
    try {
      // Filter out invalid addresses
      const validAddresses = addresses.filter(addr => this.isValidEthereumAddress(addr));
      
      if (validAddresses.length === 0) {
        this.logger.warn('No valid wallet addresses found for merkle tree initialization');
        return;
      }

      if (validAddresses.length !== addresses.length) {
        this.logger.warn(`Filtered out ${addresses.length - validAddresses.length} invalid wallet addresses`);
      }

      // Normalize addresses and create leaves
      const normalizedAddresses = validAddresses.map(addr => addr.toLowerCase());
      this.leaves = normalizedAddresses.map(addr => ethers.utils.keccak256(addr));
      
      // Create the merkle tree
      this.merkleTree = new MerkleTree(this.leaves, keccak256, { sortPairs: true });
      
      // Create a mapping of address to leaf index for quick lookups
      normalizedAddresses.forEach((addr, index) => {
        this.addressToLeafIndex.set(addr, index);
      });
      
      this.logger.log(`Merkle tree initialized with ${validAddresses.length} valid wallet addresses`);
    } catch (error) {
      this.logger.error(`Failed to initialize merkle tree: ${error.message}`, error.stack);
      throw new Error(`Failed to initialize merkle tree: ${error.message}`);
    }
  }

  /**
   * Generate a merkle proof for a given address
   * @param address The address to generate a proof for
   * @returns The proof and the leaf value
   */
  async generateProof(address: string): Promise<{ proof: string[], leaf: string } | null> {
    try {
      if (!this.merkleTree) {
        // If tree is not initialized, try to initialize it
        if (!this.initialized) {
          await this.initializeFromDatabase();
        }
        
        if (!this.merkleTree) {
          throw new Error('Merkle tree not initialized');
        }
      }
      
      const normalizedAddress = address.toLowerCase();
      const leaf = ethers.utils.keccak256(normalizedAddress);
      
      // Get the proof from the merkle tree
      const proof = this.merkleTree.getHexProof(leaf);
      
      if (proof.length === 0) {
        this.logger.warn(`No proof found for address ${address}`);
        return null;
      }
      
      this.logger.log(`Generated merkle proof for address ${address}`);
      return { proof, leaf };
    } catch (error) {
      this.logger.error(`Failed to generate proof for ${address}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Verify a merkle proof for a given address
   * @param address Address to verify
   * @param proof The merkle proof
   * @returns True if the proof is valid
   */
  verifyProof(address: string, proof: string[]): boolean {
    try {
      if (!this.merkleTree) {
        throw new Error('Merkle tree not initialized');
      }
      
      const normalizedAddress = address.toLowerCase();
      const leaf = ethers.utils.keccak256(normalizedAddress);
      
      // Convert the leaf to hex string to match proof type
      const hexLeaf = leaf.toString();
      const hexRoot = this.merkleTree.getHexRoot();
      
      // Use the proper overload with matching types (all strings)
      return this.merkleTree.verify(proof, hexLeaf, hexRoot);
    } catch (error) {
      this.logger.error(`Failed to verify proof: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get the merkle root
   * @returns The merkle root as a hex string
   */
  getRoot(): string {
    if (!this.merkleTree) {
      throw new Error('Merkle tree not initialized');
    }
    
    return this.merkleTree.getHexRoot();
  }

  /**
   * Check if the merkle tree is initialized
   */
  isInitialized(): boolean {
    return this.merkleTree !== null;
  }

  /**
   * Add a new wallet address to the merkle tree
   * @param address The wallet address to add
   */
  async addAddress(address: string): Promise<void> {
    if (!address) return;
    
    const normalizedAddress = address.toLowerCase();
    
    // Check if address is already in the tree
    if (this.addressToLeafIndex.has(normalizedAddress)) {
      return;
    }
    
    try {
      // Get all existing addresses
      const existingAddresses = Array.from(this.addressToLeafIndex.keys());
      
      // Add the new address
      existingAddresses.push(normalizedAddress);
      
      // Re-initialize the merkle tree with the updated address list
      this.initializeMerkleTree(existingAddresses);
      
      this.logger.log(`Added address ${normalizedAddress} to merkle tree`);
    } catch (error) {
      this.logger.error(`Failed to add address to merkle tree: ${error.message}`, error.stack);
    }
  }
}
