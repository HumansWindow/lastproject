import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { ShahiTokenService } from './shahi-token.service';
import { MerkleService } from './merkle.service';
import { UsersService } from '../../users/users.service';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MintingRecord } from '../entities/minting-record.entity';
import { UserMintingQueueService } from '../services/user-minting-queue.service';
import { MintingRecordType } from '../entities/minting-record.entity';

interface QueuedMintRequest {
  id: string;
  walletAddress: string;
  deviceId: string;
  mintType: 'first-time' | 'annual';
  userAgent?: string;
  ipAddress?: string;
  status?: string;
  errorMessage?: string;
}

@Injectable()
export class MintingService {
  private readonly logger = new Logger(MintingService.name);
  private batchMintingEnabled = false;
  private batchMintingInterval: any;
  private batchMintMaxSize = 10; // Default batch size
  private batchMintingIntervalMs = 5 * 60 * 1000; // 5 minutes default

  constructor(
    private readonly deviceDetector: DeviceDetectorService,
    private readonly shahiTokenService: ShahiTokenService,
    private readonly merkleService: MerkleService,
    private readonly usersService: UsersService,
    private readonly userMintingQueueService: UserMintingQueueService,
    private readonly configService: ConfigService,
    @InjectRepository(MintingRecord)
    private mintingRecordRepository: Repository<MintingRecord>
  ) {
    // Initialize batch minting configuration from environment
    this.batchMintingEnabled = this.configService.get('BATCH_MINTING_ENABLED') === 'true';
    const configuredBatchSize = this.configService.get('BATCH_MINTING_MAX_SIZE');
    if (configuredBatchSize) {
      this.batchMintMaxSize = parseInt(configuredBatchSize, 10);
    }
    const configuredInterval = this.configService.get('BATCH_MINTING_INTERVAL_MS');
    if (configuredInterval) {
      this.batchMintingIntervalMs = parseInt(configuredInterval, 10);
    }
    if (this.batchMintingEnabled) {
      this.startBatchMintingScheduler();
      this.logger.log(`Batch minting enabled with batch size ${this.batchMintMaxSize} and interval ${this.batchMintingIntervalMs}ms`);
    }
  }

  // Start the scheduler for batch minting
  private startBatchMintingScheduler() {
    this.batchMintingInterval = setInterval(async () => {
      try {
        await this.processBatchMint();
      } catch (error) {
        this.logger.error(`Error processing batch mint: ${error.message}`, error.stack);
      }
    }, this.batchMintingIntervalMs);
  }

  // Stop the scheduler (used during shutdown)
  public stopBatchMintingScheduler() {
    if (this.batchMintingInterval) {
      clearInterval(this.batchMintingInterval);
    }
  }

  // Process a batch of minting requests
  private async processBatchMint() {
    // Get pending mint requests from the queue
    const pendingMints = await this.userMintingQueueService.getNextBatch(this.batchMintMaxSize);
    if (pendingMints.length === 0) {
      this.logger.debug('No pending mint requests in queue');
      return;
    }

    this.logger.log(`Processing batch mint for ${pendingMints.length} users`);
    try {
      // Group by mint type (first-time vs annual)
      const firstTimeMints = pendingMints.filter(mint => mint.mintType === 'first-time');
      const annualMints = pendingMints.filter(mint => mint.mintType === 'annual');
      let txHash = '';

      // Process first-time mints in a batch if any
      if (firstTimeMints.length > 0) {
        const addresses = firstTimeMints.map(mint => mint.walletAddress);
        const deviceIds = firstTimeMints.map(mint => mint.deviceId);
        
        // Prepare proofs for each address (this is placeholder logic - you'd need to implement this properly)
        const proofs = await Promise.all(addresses.map(address => 
          this.merkleService.generateProof(address).then(data => data?.proof || [])
        ));
        
        // Call the service with the updated parameter list
        txHash = await this.shahiTokenService.batchMintFirstTimeTokens(addresses, deviceIds, proofs);
        
        // Save records for each user
        for (const mint of firstTimeMints) {
          await this.mintingRecordRepository.save({
            userId: mint.userId,
            walletAddress: mint.walletAddress,
            type: MintingRecordType.FIRST_TIME,
            transactionHash: txHash,
            amount: '0.5', // 0.5 SHAHI to user
            deviceId: mint.deviceId,
            ipAddress: mint.ipAddress,
          });
          // Remove from queue
          await this.userMintingQueueService.cancelMintingRequest(mint.id);
        }
        this.logger.log(`Batch first-time mint completed for ${firstTimeMints.length} users. TX: ${txHash}`);
      }

      // Process annual mints in a batch if any
      if (annualMints.length > 0) {
        const addresses = annualMints.map(mint => mint.walletAddress);
        const deviceIds = annualMints.map(mint => mint.deviceId);
        
        // Generate signatures for each address-device pair
        const signatures = await Promise.all(
          addresses.map((address, i) => this.shahiTokenService.generateMintingSignature(address, deviceIds[i]))
        );
        
        // Call the service with the updated parameter list
        txHash = await this.shahiTokenService.batchMintAnnualTokens(addresses, deviceIds, signatures);
        
        // Save records for each user
        for (const mint of annualMints) {
          await this.mintingRecordRepository.save({
            userId: mint.userId,
            walletAddress: mint.walletAddress,
            type: MintingRecordType.ANNUAL,
            transactionHash: txHash,
            amount: '0.5', // 0.5 SHAHI to user
            deviceId: mint.deviceId,
            ipAddress: mint.ipAddress,
          });
          // Remove from queue
          await this.userMintingQueueService.cancelMintingRequest(mint.id);
        }
        this.logger.log(`Batch annual mint completed for ${annualMints.length} users. TX: ${txHash}`);
      }
      return txHash;
    } catch (error) {
      this.logger.error(`Error during batch minting: ${error.message}`, error.stack);
      // Mark mints as failed
      for (const mint of pendingMints) {
        await this.userMintingQueueService.markMintAsFailed(mint.id, error.message);
      }
      throw error;
    }
  }

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
    if (this.batchMintingEnabled) {
      // Add to queue for batch processing
      const queuedRequest = await this.userMintingQueueService.queueMintRequest({
        walletAddress,
        deviceId,
        mintType: 'first-time',
        userAgent,
        ipAddress: ip
      });
      this.logger.log(`First-time mint request queued for wallet ${walletAddress} with ID ${queuedRequest.id}`);
      
      // If queue reaches threshold, trigger immediate batch processing
      const queueLength = await this.userMintingQueueService.getPendingRequestsCount();
      if (queueLength >= this.batchMintMaxSize) {
        this.logger.log(`Queue threshold reached (${queueLength}). Triggering immediate batch processing.`);
        this.processBatchMint().catch(err => {
          this.logger.error(`Failed to process immediate batch mint: ${err.message}`);
        });
      }
      
      // Return a pending transaction hash
      return `pending-batch-${queuedRequest.id}`;
    } else {
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
    if (this.batchMintingEnabled) {
      // Add to queue for batch processing
      const queuedRequest = await this.userMintingQueueService.queueMintRequest({
        walletAddress,
        deviceId,
        mintType: 'annual',
        userAgent,
        ipAddress: ip
      });
      this.logger.log(`Annual mint request queued for wallet ${walletAddress} with ID ${queuedRequest.id}`);
      
      // If queue reaches threshold, trigger immediate batch processing
      const queueLength = await this.userMintingQueueService.getPendingRequestsCount();
      if (queueLength >= this.batchMintMaxSize) {
        this.logger.log(`Queue threshold reached (${queueLength}). Triggering immediate batch processing.`);
        this.processBatchMint().catch(err => {
          this.logger.error(`Failed to process immediate batch mint: ${err.message}`);
        });
      }
      
      // Return a pending transaction hash
      return `pending-batch-${queuedRequest.id}`;
    } else {
      try {
        // Generate signature needed for annual minting
        const signature = await this.shahiTokenService.generateMintingSignature(walletAddress, deviceId);

        // Call the smart contract to mint tokens with all required parameters
        const txHash = await this.shahiTokenService.annualMint(
          walletAddress,
          deviceId,
          signature
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
  }

  /**
   * Process an automated minting for a new user
   * @param walletAddress User's wallet address
   */
  async processMintForNewUser(walletAddress: string): Promise<string | null> {
    this.logger.log(`Processing new user mint for ${walletAddress}`);
    try {
      // Call the smart contract to mint tokens (updated to match service method signature)
      const txHash = await this.shahiTokenService.mintForNewUser(walletAddress);
      
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

  // Check status of a minting operation
  async getMintStatus(walletAddressOrTxId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    txHash?: string;
    error?: string;
  }> {
    // First check if this is a pending batch tx ID
    if (walletAddressOrTxId.startsWith('pending-batch-')) {
      const requestId = walletAddressOrTxId.replace('pending-batch-', '');
      const request = await this.userMintingQueueService.getQueueItem(requestId);
      if (!request) {
        return { status: 'completed' }; // Assume it was processed and removed
      }
      if (request.status === 'failed') {
        return {
          status: 'failed',
          error: request.errorMessage || 'Unknown error during batch processing'
        };
      }
      return { status: 'pending' };
    }
    
    // Otherwise check if it's a wallet address with recent successful mints
    const recentMint = await this.mintingRecordRepository.findOne({
      where: { walletAddress: walletAddressOrTxId },
      order: { createdAt: 'DESC' }
    });
    if (recentMint) {
      return {
        status: 'completed',
        txHash: recentMint.transactionHash
      };
    }
    
    // If not found in our database, assume pending
    return { status: 'pending' };
  }

  /**
   * Get the current batch queue length
   * @returns The number of pending mint requests in the queue
   */
  async getBatchQueueLength(): Promise<number> {
    if (!this.batchMintingEnabled) {
      return 0;
    }
    return await this.userMintingQueueService.getPendingCount();
  }

  /**
   * Check if batch minting is enabled
   * @returns True if batch minting is enabled
   */
  isBatchMintingEnabled(): boolean {
    return this.batchMintingEnabled;
  }

  /**
   * Get the maximum batch size
   * @returns The maximum number of mint requests per batch
   */
  getBatchMintMaxSize(): number {
    return this.batchMintMaxSize;
  }

  /**
   * Get the estimated time for the next batch mint processing
   * @returns Date object representing the next scheduled batch mint time
   */
  async getNextBatchMintTime(): Promise<Date | null> {
    if (!this.batchMintingEnabled || !this.batchMintingInterval) {
      return null;
    }
    
    // If queue length is at or above threshold, next batch will process immediately
    const queueLength = await this.getBatchQueueLength();
    if (queueLength >= this.batchMintMaxSize) {
      return new Date();
    }
    
    // Otherwise, calculate next scheduled time
    const now = new Date().getTime();
    const interval = this.batchMintingIntervalMs;
    const nextTime = new Date(Math.ceil(now / interval) * interval);
    
    return nextTime;
  }
}
