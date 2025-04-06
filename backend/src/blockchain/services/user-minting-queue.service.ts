import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { MintingQueueItem, MintingQueueItemStatus, MintingQueueItemType } from '../entities/minting-queue-item.entity';
import { ShahiTokenService } from './shahi-token.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface QueuedMintRequest {
  id: string;
  walletAddress: string;
  deviceId: string;
  userId?: string;
  mintType: 'first-time' | 'annual';
  userAgent?: string;
  ipAddress?: string;
  status?: string;
  errorMessage?: string;
}

@Injectable()
export class UserMintingQueueService {
  private readonly logger = new Logger(UserMintingQueueService.name);
  private isProcessingQueue = false;

  constructor(
    @InjectRepository(MintingQueueItem)
    private mintingQueueRepository: Repository<MintingQueueItem>,
    private shahiTokenService: ShahiTokenService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Add a first-time minting request to the queue
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param deviceId Device identifier
   * @param merkleProof Merkle proof for eligibility verification
   * @param ipAddress User's IP address (for security tracking)
   */
  async queueFirstTimeMinting(
    userId: string,
    walletAddress: string,
    deviceId: string,
    merkleProof: string[],
    ipAddress?: string,
  ): Promise<MintingQueueItem> {
    try {
      // Check if there's already a pending or processing request
      const existingRequest = await this.mintingQueueRepository.findOne({
        where: {
          userId,
          walletAddress,
          type: MintingQueueItemType.FIRST_TIME,
          status: MintingQueueItemStatus.PENDING,
        },
      });

      if (existingRequest) {
        this.logger.log(`First-time minting request for wallet ${walletAddress.substring(0, 8)}... already exists in queue`);
        return existingRequest;
      }

      // Create new queue item
      const queueItem = this.mintingQueueRepository.create({
        userId,
        walletAddress,
        deviceId,
        type: MintingQueueItemType.FIRST_TIME,
        status: MintingQueueItemStatus.PENDING,
        merkleProof: JSON.stringify(merkleProof),
        ipAddress,
        amount: '0', // For first-time minting, amount is determined by contract
        priority: 10, // First-time minting has high priority
      });

      // Save to database
      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Added first-time minting request to queue for wallet ${walletAddress.substring(0, 8)}...`);
      
      // Emit event for monitoring
      this.eventEmitter.emit('minting.queued', {
        type: 'first_time',
        userId,
        walletAddress,
        queueItemId: queueItem.id,
      });

      return queueItem;
    } catch (error) {
      this.logger.error(`Error queueing first-time minting: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add an annual minting request to the queue
   * @param userId User ID
   * @param walletAddress Wallet address
   * @param deviceId Device identifier
   * @param ipAddress User's IP address (for security tracking)
   */
  async queueAnnualMinting(
    userId: string,
    walletAddress: string,
    deviceId: string,
    ipAddress?: string,
  ): Promise<MintingQueueItem> {
    try {
      // Check if there's already a pending or processing request
      const existingRequest = await this.mintingQueueRepository.findOne({
        where: {
          userId,
          walletAddress,
          type: MintingQueueItemType.ANNUAL,
          status: MintingQueueItemStatus.PENDING,
        },
      });

      if (existingRequest) {
        this.logger.log(`Annual minting request for wallet ${walletAddress.substring(0, 8)}... already exists in queue`);
        return existingRequest;
      }

      // First generate the signature needed for annual minting
      const signature = await this.shahiTokenService.generateMintingSignature(
        walletAddress,
        deviceId,
      );

      // Create new queue item
      const queueItem = this.mintingQueueRepository.create({
        userId,
        walletAddress,
        deviceId,
        type: MintingQueueItemType.ANNUAL,
        status: MintingQueueItemStatus.PENDING,
        signature,
        ipAddress,
        amount: '0', // For annual minting, amount is determined by contract
        priority: 5, // Standard priority
      });

      // Save to database
      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Added annual minting request to queue for wallet ${walletAddress.substring(0, 8)}...`);
      
      // Emit event for monitoring
      this.eventEmitter.emit('minting.queued', {
        type: 'annual',
        userId,
        walletAddress,
        queueItemId: queueItem.id,
      });

      return queueItem;
    } catch (error) {
      this.logger.error(`Error queueing annual minting: ${error.message}`);
      throw error;
    }
  }

  /**
   * Queue an admin minting (admin only)
   * @param userId Admin user ID
   * @param destinationWallet Destination wallet address
   * @param amount Amount to mint
   */
  async queueAdminMinting(
    userId: string,
    destinationWallet: string,
    amount: string,
  ): Promise<MintingQueueItem> {
    try {
      // Create new queue item for admin minting
      const queueItem = this.mintingQueueRepository.create({
        userId,
        walletAddress: destinationWallet,
        type: MintingQueueItemType.ADMIN,
        status: MintingQueueItemStatus.PENDING,
        amount,
        priority: 1, // Highest priority
      });

      // Save to database
      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Added admin minting request to queue for wallet ${destinationWallet.substring(0, 8)}...`);
      
      // Emit event for monitoring
      this.eventEmitter.emit('minting.queued', {
        type: 'admin',
        userId,
        walletAddress: destinationWallet,
        queueItemId: queueItem.id,
        amount,
      });

      return queueItem;
    } catch (error) {
      this.logger.error(`Error queueing admin minting: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a minting request by ID
   * @param id Queue item ID
   */
  async getQueueItem(id: string): Promise<MintingQueueItem> {
    return this.mintingQueueRepository.findOne({ where: { id } });
  }

  /**
   * Get all minting requests for a user
   * @param userId User ID
   */
  async getQueueItemsByUser(userId: string): Promise<MintingQueueItem[]> {
    return this.mintingQueueRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get minting history for a wallet address
   * @param walletAddress Wallet address
   */
  async getMintingHistoryByWallet(walletAddress: string): Promise<MintingQueueItem[]> {
    return this.mintingQueueRepository.find({
      where: { walletAddress },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Cancel a pending minting request
   * @param id Queue item ID
   */
  async cancelMintingRequest(id: string): Promise<MintingQueueItem> {
    const queueItem = await this.mintingQueueRepository.findOne({ where: { id } });
    
    if (!queueItem) {
      throw new Error('Minting request not found');
    }
    
    if (queueItem.status !== MintingQueueItemStatus.PENDING) {
      throw new Error(`Cannot cancel minting request with status ${queueItem.status}`);
    }
    
    queueItem.status = MintingQueueItemStatus.CANCELLED;
    return this.mintingQueueRepository.save(queueItem);
  }

  /**
   * Process the next batch of minting requests
   * @param batchSize Number of requests to process (default 5)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue(batchSize = 5): Promise<void> {
    if (this.isProcessingQueue) {
      this.logger.log('Queue processing already in progress, skipping...');
      return;
    }

    this.isProcessingQueue = true;

    try {
      this.logger.log('Processing minting queue...');
      
      // Get pending items ordered by priority and created date
      const pendingItems = await this.mintingQueueRepository.find({
        where: {
          status: MintingQueueItemStatus.PENDING,
          processAfter: LessThan(new Date()) || IsNull(),
        },
        order: {
          priority: 'ASC', // Lower number means higher priority
          createdAt: 'ASC', // Process older requests first
        },
        take: batchSize,
      });

      this.logger.log(`Found ${pendingItems.length} pending minting requests to process`);

      for (const item of pendingItems) {
        await this.processQueueItem(item);
      }

      this.logger.log('Finished processing minting queue');
    } catch (error) {
      this.logger.error(`Error processing minting queue: ${error.message}`);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Process a single queue item
   * @param item Queue item to process
   */
  async processQueueItem(item: MintingQueueItem): Promise<void> {
    // Update status to processing
    item.status = MintingQueueItemStatus.PROCESSING;
    item.processingStartedAt = new Date();
    await this.mintingQueueRepository.save(item);
    
    try {
      let transactionHash: string;
      
      switch (item.type) {
        case MintingQueueItemType.FIRST_TIME:
          // Process first-time minting
          const merkleProof = JSON.parse(item.merkleProof);
          transactionHash = await this.shahiTokenService.firstTimeMint(
            item.walletAddress,
            item.deviceId,
            merkleProof,
          );
          break;
          
        case MintingQueueItemType.ANNUAL:
          // Process annual minting
          transactionHash = await this.shahiTokenService.annualMint(
            item.walletAddress,
            item.deviceId,
            item.signature,
          );
          break;
          
        case MintingQueueItemType.ADMIN:
          // Process admin minting
          transactionHash = await this.shahiTokenService.adminMint(
            item.walletAddress,
            item.amount,
          );
          break;
          
        default:
          throw new Error(`Unsupported minting type: ${item.type}`);
      }
      
      // Update queue item with successful result
      item.status = MintingQueueItemStatus.COMPLETED;
      item.transactionHash = transactionHash;
      item.completedAt = new Date();
      item.processedAt = new Date();
      await this.mintingQueueRepository.save(item);
      
      // Emit completion event
      this.eventEmitter.emit('minting.completed', {
        type: item.type,
        userId: item.userId,
        walletAddress: item.walletAddress,
        queueItemId: item.id,
        transactionHash,
      });
      
      this.logger.log(`Successfully processed ${item.type} minting for ${item.walletAddress.substring(0, 8)}..., tx: ${transactionHash}`);
    } catch (error) {
      // Handle failure
      item.status = MintingQueueItemStatus.FAILED;
      item.errorMessage = error.message;
      item.retryCount += 1;
      item.processedAt = new Date();
      
      // If we haven't hit max retries, schedule for retry later
      if (item.retryCount < item.maxRetries) {
        item.status = MintingQueueItemStatus.PENDING;
        // Exponential backoff - wait longer after each failure
        const retryDelayMinutes = Math.pow(2, item.retryCount) * 5;
        item.processAfter = new Date(Date.now() + retryDelayMinutes * 60 * 1000);
        
        this.logger.log(`Scheduling retry for ${item.type} minting for ${item.walletAddress.substring(0, 8)}... in ${retryDelayMinutes} minutes (attempt ${item.retryCount + 1}/${item.maxRetries})`);
      } else {
        this.logger.error(`${item.type} minting failed for ${item.walletAddress.substring(0, 8)}... after ${item.maxRetries} attempts: ${error.message}`);
        
        // Emit failure event
        this.eventEmitter.emit('minting.failed', {
          type: item.type,
          userId: item.userId,
          walletAddress: item.walletAddress,
          queueItemId: item.id,
          error: error.message,
        });
      }
      
      await this.mintingQueueRepository.save(item);
    }
  }

  /**
   * Check if a user has a specific type of minting in progress
   * @param userId User ID
   * @param type Minting type
   */
  async hasActiveRequest(userId: string, type?: MintingQueueItemType): Promise<boolean> {
    const whereCondition: any = {
      userId,
      status: MintingQueueItemStatus.PENDING || MintingQueueItemStatus.PROCESSING,
    };
    
    if (type) {
      whereCondition.type = type;
    }
    
    const count = await this.mintingQueueRepository.count({ where: whereCondition });
    return count > 0;
  }

  /**
   * Manually trigger queue processing
   */
  async triggerQueueProcessing(batchSize = 10): Promise<void> {
    await this.processQueue(batchSize);
  }

  /**
   * Get statistics on minting requests
   */
  async getQueueStatistics() {
    const pendingCount = await this.mintingQueueRepository.count({
      where: { status: MintingQueueItemStatus.PENDING },
    });
    
    const processingCount = await this.mintingQueueRepository.count({
      where: { status: MintingQueueItemStatus.PROCESSING },
    });
    
    const completedCount = await this.mintingQueueRepository.count({
      where: { status: MintingQueueItemStatus.COMPLETED },
    });
    
    const failedCount = await this.mintingQueueRepository.count({
      where: { status: MintingQueueItemStatus.FAILED },
    });
    
    return {
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      total: pendingCount + processingCount + completedCount + failedCount,
    };
  }

  /**
   * Adds a minting request to the queue
   * @param userId User ID
   * @param walletAddress Wallet address to mint tokens to
   * @param type Type of minting operation
   * @param deviceId User's device ID (optional)
   * @param merkleProof Merkle proof for verification (for first-time minting)
   * @param signature Minting signature (for annual minting)
   * @param metadata Additional metadata
   * @returns The created queue item
   */
  async addToQueue(
    userId: string,
    walletAddress: string,
    type: MintingQueueItemType,
    deviceId?: string,
    merkleProof?: string,
    signature?: string,
    metadata?: Record<string, any>,
  ): Promise<MintingQueueItem> {
    try {
      const queueItem = this.mintingQueueRepository.create({
        userId,
        walletAddress,
        type,
        deviceId,
        merkleProof: merkleProof ? JSON.stringify(merkleProof) : null,
        signature,
        status: MintingQueueItemStatus.PENDING,
        metadata,
      });
      
      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Added ${type} minting request to queue for user ${userId}`);
      
      // Emit an event that a new item was added to the queue
      this.eventEmitter.emit('minting.queued', queueItem);
      
      return queueItem;
    } catch (error) {
      this.logger.error(`Failed to add minting request to queue: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processes pending items in the queue
   * @param limit Maximum number of items to process
   * @returns Processing results
   */
  async processPendingItems(limit = 10): Promise<{ processed: number, successful: number, failed: number }> {
    try {
      // Find pending items
      const pendingItems = await this.mintingQueueRepository.find({
        where: { status: MintingQueueItemStatus.PENDING },
        order: { priority: 'DESC', createdAt: 'ASC' },
        take: limit,
      });
      
      if (pendingItems.length === 0) {
        return { processed: 0, successful: 0, failed: 0 };
      }
      
      this.logger.log(`Processing ${pendingItems.length} pending minting requests`);
      
      let successful = 0;
      let failed = 0;
      
      for (const item of pendingItems) {
        try {
          // Mark as processing
          item.status = MintingQueueItemStatus.PROCESSING;
          item.processingStartedAt = new Date();
          await this.mintingQueueRepository.save(item);
          
          // Process based on type
          let txHash: string;
          
          if (item.type === MintingQueueItemType.FIRST_TIME) {
            const proof = item.merkleProof ? JSON.parse(item.merkleProof) : [];
            txHash = await this.shahiTokenService.firstTimeMint(
              item.walletAddress,
              item.deviceId,
              proof,
            );
          } else if (item.type === MintingQueueItemType.ANNUAL) {
            txHash = await this.shahiTokenService.annualMint(
              item.walletAddress,
              item.deviceId,
              item.signature,
            );
          } else if (item.type === MintingQueueItemType.ADMIN) {
            const amount = item.metadata?.amount || '1000000000000000000'; // Default 1 token if not specified
            txHash = await this.shahiTokenService.adminMint(item.walletAddress, amount);
          } else {
            throw new Error(`Unsupported minting type: ${item.type}`);
          }
          
          // Mark as completed
          item.status = MintingQueueItemStatus.COMPLETED;
          item.transactionHash = txHash;
          item.completedAt = new Date();
          await this.mintingQueueRepository.save(item);
          
          successful++;
          this.logger.log(`Successfully processed minting request ${item.id}, tx: ${txHash}`);
          
          // Emit completion event
          this.eventEmitter.emit('minting.completed', item);
        } catch (error) {
          // Mark as failed
          item.status = MintingQueueItemStatus.FAILED;
          item.errorMessage = error.message;
          item.retryCount++;
          
          if (item.retryCount < item.maxRetries) {
            item.status = MintingQueueItemStatus.PENDING;
            // Exponential backoff for retries
            item.processAfter = new Date(Date.now() + Math.pow(2, item.retryCount) * 30000);
          }
          
          await this.mintingQueueRepository.save(item);
          
          failed++;
          this.logger.error(`Failed to process minting request ${item.id}: ${error.message}`);
          
          // Emit failure event
          this.eventEmitter.emit('minting.failed', { item, error });
        }
      }
      
      return { processed: pendingItems.length, successful, failed };
    } catch (error) {
      this.logger.error(`Error processing minting queue: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Gets the pending queue count
   * @returns Number of pending items in the queue
   */
  async getPendingCount(): Promise<number> {
    return this.mintingQueueRepository.count({
      where: { status: MintingQueueItemStatus.PENDING }
    });
  }
  
  /**
   * Gets the recent minting operations for a user
   * @param userId User ID
   * @param limit Maximum number of items to return
   * @returns Array of recent minting operations
   */
  async getUserMintingHistory(userId: string, limit = 10): Promise<MintingQueueItem[]> {
    return this.mintingQueueRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get next batch of pending mint requests
   * @param batchSize Maximum number of requests to retrieve
   * @returns Array of pending mint requests
   */
  async getNextBatch(batchSize: number): Promise<QueuedMintRequest[]> {
    const pendingItems = await this.mintingQueueRepository.find({
      where: { status: MintingQueueItemStatus.PENDING },
      order: { priority: 'ASC', createdAt: 'ASC' },
      take: batchSize,
    });

    return pendingItems.map(item => ({
      id: item.id,
      walletAddress: item.walletAddress,
      deviceId: item.deviceId || '',
      userId: item.userId,
      mintType: item.type === MintingQueueItemType.FIRST_TIME 
        ? 'first-time' 
        : item.type === MintingQueueItemType.ANNUAL 
          ? 'annual' 
          : 'first-time',
      ipAddress: item.ipAddress,
      status: item.status
    }));
  }

  /**
   * Queue a mint request
   * @param requestData Request data containing wallet address, device ID, and mint type
   * @returns The created queue item
   */
  async queueMintRequest(requestData: {
    walletAddress: string;
    deviceId: string;
    mintType: 'first-time' | 'annual';
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
  }): Promise<QueuedMintRequest> {
    try {
      // Convert mint type to enum
      const mintType = requestData.mintType === 'first-time'
        ? MintingQueueItemType.FIRST_TIME
        : MintingQueueItemType.ANNUAL;

      // Create queue item
      const queueItem = this.mintingQueueRepository.create({
        userId: requestData.userId || 'system',
        walletAddress: requestData.walletAddress,
        deviceId: requestData.deviceId,
        type: mintType,
        status: MintingQueueItemStatus.PENDING,
        ipAddress: requestData.ipAddress,
        metadata: {
          userAgent: requestData.userAgent
        },
        priority: mintType === MintingQueueItemType.FIRST_TIME ? 10 : 5,
      });

      // Save queue item
      await this.mintingQueueRepository.save(queueItem);

      // Return formatted result
      return {
        id: queueItem.id,
        walletAddress: queueItem.walletAddress,
        deviceId: queueItem.deviceId,
        userId: queueItem.userId,
        mintType: requestData.mintType,
        status: queueItem.status,
      };
    } catch (error) {
      this.logger.error(`Failed to queue mint request: ${error.message}`);
      throw new Error(`Failed to queue mint request: ${error.message}`);
    }
  }

  /**
   * Mark a mint request as failed
   * @param requestId Queue item ID
   * @param errorMessage Error message describing the failure
   */
  async markMintAsFailed(requestId: string, errorMessage: string): Promise<void> {
    try {
      const queueItem = await this.mintingQueueRepository.findOne({ where: { id: requestId } });
      
      if (!queueItem) {
        throw new Error(`Mint request with ID ${requestId} not found`);
      }

      queueItem.status = MintingQueueItemStatus.FAILED;
      queueItem.errorMessage = errorMessage;
      queueItem.processedAt = new Date();

      await this.mintingQueueRepository.save(queueItem);
      this.logger.log(`Marked mint request ${requestId} as failed`);
    } catch (error) {
      this.logger.error(`Failed to mark mint as failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the count of pending mint requests
   * @returns Number of pending requests
   */
  async getPendingRequestsCount(): Promise<number> {
    return this.getPendingCount();
  }
}