import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { ShahiTokenService } from './shahi-token.service';
import { MerkleService } from './merkle.service';
import { UsersService } from '../../users/users.service';
import { ethers } from 'ethers';

@Injectable()
export class MintingService {
  private readonly logger = new Logger(MintingService.name);

  constructor(
    private readonly deviceDetector: DeviceDetectorService,
    private readonly shahiTokenService: ShahiTokenService,
    private readonly merkleService: MerkleService,
    private readonly usersService: UsersService
  ) {}

  /**
   * Process a first-time minting request
   * @param walletAddress User's wallet address
   * @param userAgent User's browser agent
   * @param ip User's IP address
   * @param deviceId Unique device identifier
   */
  async processFirstTimeMint(
    walletAddress: string,
    userAgent: string,
    ip: string,
    deviceId: string
  ): Promise<string> {
    this.logger.log(`Processing first-time mint for ${walletAddress}`);
    
    try {
      // Generate merkle proof for verification
      const merkleData = await this.merkleService.generateProof(walletAddress);
      
      if (!merkleData || !merkleData.proof) {
        throw new Error('Failed to generate merkle proof for verification');
      }
      
      // Call the smart contract to mint tokens
      const txHash = await this.shahiTokenService.firstTimeMint(
        walletAddress,
        deviceId,
        merkleData.proof
      );
      
      // Record the minting event in our database
      // Standard first-time mint is 0.5 SHAHI tokens to the user
      await this.usersService.recordTokenMinting(walletAddress, 0.5);
      
      this.logger.log(`First-time mint successful for ${walletAddress}. Transaction: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `First-time mint failed for ${walletAddress}: ${error.message}`,
        error.stack
      );
      throw new Error(`Minting failed: ${error.message}`);
    }
  }

  /**
   * Process an annual minting request
   * @param walletAddress User's wallet address
   * @param userAgent User's browser agent
   * @param ip User's IP address
   * @param deviceId Unique device identifier
   */
  async processAnnualMint(
    walletAddress: string,
    userAgent: string,
    ip: string,
    deviceId: string
  ): Promise<string> {
    this.logger.log(`Processing annual mint for ${walletAddress}`);
    
    try {
      // Call the smart contract to mint tokens
      const txHash = await this.shahiTokenService.annualMint(
        walletAddress,
        deviceId
      );
      
      // Record the minting event in our database
      // Annual mint is 0.5 SHAHI tokens to the user
      await this.usersService.recordTokenMinting(walletAddress, 0.5);
      
      this.logger.log(`Annual mint successful for ${walletAddress}. Transaction: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Annual mint failed for ${walletAddress}: ${error.message}`,
        error.stack
      );
      throw new Error(`Minting failed: ${error.message}`);
    }
  }

  /**
   * Process an automated minting for a new user
   * @param walletAddress User's wallet address
   * @param deviceId Optional device identifier
   */
  async processMintForNewUser(
    walletAddress: string,
    deviceId?: string
  ): Promise<string | null> {
    this.logger.log(`Processing new user mint for ${walletAddress}`);
    
    try {
      // Call the smart contract to mint tokens
      const txHash = await this.shahiTokenService.mintForNewUser(
        walletAddress,
        deviceId
      );
      
      if (txHash) {
        // Record the minting event in our database
        // New user mint is 0.5 SHAHI tokens to the user
        await this.usersService.recordTokenMinting(walletAddress, 0.5);
        
        this.logger.log(`New user mint successful for ${walletAddress}. Transaction: ${txHash}`);
      }
      
      return txHash;
    } catch (error) {
      this.logger.error(
        `New user mint failed for ${walletAddress}: ${error.message}`,
        error.stack
      );
      return null;
    }
  }
}
