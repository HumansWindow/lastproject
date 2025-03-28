import { Injectable } from '@nestjs/common';
import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MerkleService {
  private merkleTree: MerkleTree;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async updateMerkleTree(): Promise<string> {
    // Get all verified users
    const users = await this.userRepository.find({ 
      where: { isVerified: true },
      select: ['walletAddress']
    });

    // Create leaves from user wallet addresses
    const leaves = users.map(user => 
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(['address'], [user.walletAddress])
      )
    );

    // Generate Merkle Tree
    this.merkleTree = new MerkleTree(leaves, ethers.utils.keccak256, { sortPairs: true });
    
    // Return root for contract update
    return this.merkleTree.getHexRoot();
  }

  getProof(address: string): string[] {
    const leaf = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address'], [address])
    );
    return this.merkleTree.getHexProof(leaf);
  }

  verifyProof(address: string, proof: string[]): boolean {
    const leaf = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(['address'], [address])
    );
    return this.merkleTree.verify(proof, leaf, this.merkleTree.getRoot());
  }
}
