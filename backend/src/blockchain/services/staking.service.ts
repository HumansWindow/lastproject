import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { StakingPosition, StakingStatus } from '../entities/staking-position.entity';
import { ApyTier } from '../entities/apy-tier.entity';
import { ShahiTokenService } from './shahi-token.service';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StakingService {
  private readonly logger = new Logger(StakingService.name);
  private provider: ethers.providers.JsonRpcProvider;

  constructor(
    @InjectRepository(StakingPosition)
    private stakingPositionRepository: Repository<StakingPosition>,
    @InjectRepository(ApyTier)
    private apyTierRepository: Repository<ApyTier>,
    private shahiTokenService: ShahiTokenService,
    private configService: ConfigService
  ) {
    const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Create a new staking position
   * @param userId User ID
   * @param walletAddress User's wallet address
   * @param amount Amount to stake in wei format
   * @param lockPeriodDays Lock period in days (0 for flexible staking)
   * @param autoCompound Whether to auto-compound rewards
   * @param autoClaimEnabled Whether to auto-claim rewards
   * @returns Created staking position
   */
  async createStakingPosition(
    userId: string,
    walletAddress: string,
    amount: string,
    lockPeriodDays: number,
    autoCompound = false,
    autoClaimEnabled = false,
  ): Promise<StakingPosition> {
    try {
      this.logger.log(`Creating staking position for user ${userId}, amount: ${amount}`);

      // Get appropriate APY tier based on lock period
      const apyTier = await this.getApyTierByLockPeriod(lockPeriodDays);
      
      // Calculate lock period in seconds
      const lockPeriodSeconds = lockPeriodDays * 24 * 60 * 60;
      
      // Prepare staking position data
      const newPosition = this.stakingPositionRepository.create({
        userId,
        walletAddress,
        amount,
        lockPeriod: lockPeriodSeconds,
        apyRate: apyTier.apyRate,
        startTime: new Date(),
        endTime: lockPeriodDays > 0 ? new Date(Date.now() + lockPeriodDays * 24 * 60 * 60 * 1000) : null,
        accumulatedRewards: '0',
        lastClaimTime: new Date(),
        autoCompound,
        autoClaimEnabled,
        status: StakingStatus.ACTIVE,
      });
      
      // Save staking position to database
      return this.stakingPositionRepository.save(newPosition);
    } catch (error) {
      this.logger.error(`Error creating staking position: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get APY tier based on lock period
   * @param lockPeriodDays Lock period in days
   * @returns APY tier information
   */
  async getApyTierByLockPeriod(lockPeriodDays: number): Promise<ApyTier> {
    try {
      // Find most appropriate APY tier
      const apyTier = await this.apyTierRepository.findOne({
        where: { lockPeriodDays, isActive: true },
      });
      
      // If no exact match, get default APY tier
      if (!apyTier) {
        const defaultTier = await this.apyTierRepository.findOne({
          where: { isActive: true, lockPeriodDays: 0 },
        });
        
        if (!defaultTier) {
          throw new Error('No APY tier configuration found');
        }
        
        return defaultTier;
      }
      
      return apyTier;
    } catch (error) {
      this.logger.error(`Error getting APY tier: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all active APY tiers
   * @returns List of active APY tiers
   */
  async getApyTiers(): Promise<ApyTier[]> {
    return this.apyTierRepository.find({
      where: { isActive: true },
      order: { priority: 'ASC' },
    });
  }
  
  /**
   * Get staking positions for a user
   * @param userId User ID
   * @returns List of user's staking positions
   */
  async getUserStakingPositions(userId: string): Promise<StakingPosition[]> {
    return this.stakingPositionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
  
  /**
   * Get staking positions for a wallet
   * @param walletAddress Wallet address
   * @returns List of wallet's staking positions
   */
  async getWalletStakingPositions(walletAddress: string): Promise<StakingPosition[]> {
    return this.stakingPositionRepository.find({
      where: { walletAddress },
      order: { createdAt: 'DESC' },
    });
  }
  
  /**
   * Get a specific staking position
   * @param id Staking position ID
   * @returns Staking position details
   */
  async getStakingPosition(id: string): Promise<StakingPosition> {
    const position = await this.stakingPositionRepository.findOne({
      where: { id },
    });
    
    if (!position) {
      throw new NotFoundException('Staking position not found');
    }
    
    return position;
  }
  
  /**
   * Calculate current rewards for a staking position
   * @param positionId Staking position ID
   * @returns Calculated rewards
   */
  async calculateRewards(positionId: string): Promise<string> {
    const position = await this.getStakingPosition(positionId);
    
    if (position.status !== StakingStatus.ACTIVE) {
      return '0';
    }
    
    // Calculate time elapsed since last claim
    const now = new Date();
    const elapsedTimeMs = now.getTime() - position.lastClaimTime.getTime();
    const elapsedYears = elapsedTimeMs / (1000 * 60 * 60 * 24 * 365);
    
    // Calculate rewards: principal * APY * time
    const principalBN = ethers.BigNumber.from(position.amount);
    const apyRate = ethers.BigNumber.from(position.apyRate * 100); // Convert to basis points
    const timeFactorBN = ethers.utils.parseEther(elapsedYears.toFixed(18));
    
    // rewards = principal * APY * time / 10000 (APY in basis points)
    const rewardsBN = principalBN.mul(apyRate).mul(timeFactorBN).div(10000);
    
    return rewardsBN.toString();
  }
  
  /**
   * Claim rewards from a staking position
   * @param userId User ID
   * @param positionId Staking position ID
   * @returns Updated staking position
   */
  async claimRewards(userId: string, positionId: string): Promise<StakingPosition> {
    const position = await this.getStakingPosition(positionId);
    
    // Verify ownership
    if (position.userId !== userId) {
      throw new Error('Unauthorized access to staking position');
    }
    
    // Verify position is active
    if (position.status !== StakingStatus.ACTIVE) {
      throw new Error('Cannot claim rewards from inactive position');
    }
    
    // Calculate current rewards
    const currentRewards = await this.calculateRewards(positionId);
    
    if (currentRewards === '0') {
      return position;
    }
    
    // Update position with claimed rewards
    position.accumulatedRewards = ethers.BigNumber.from(position.accumulatedRewards)
      .add(currentRewards).toString();
    position.lastClaimTime = new Date();
    
    return this.stakingPositionRepository.save(position);
  }
  
  /**
   * Withdraw a staking position
   * @param userId User ID
   * @param positionId Staking position ID
   * @returns Updated staking position
   */
  async withdrawStakingPosition(userId: string, positionId: string): Promise<StakingPosition> {
    const position = await this.getStakingPosition(positionId);
    
    // Verify ownership
    if (position.userId !== userId) {
      throw new Error('Unauthorized access to staking position');
    }
    
    // Verify position is active
    if (position.status !== StakingStatus.ACTIVE) {
      throw new Error('Cannot withdraw inactive position');
    }
    
    const now = new Date();
    const isEarlyWithdrawal = position.endTime && now < position.endTime;
    
    // Update position status
    position.status = isEarlyWithdrawal ? StakingStatus.WITHDRAWN_EARLY : StakingStatus.COMPLETED;
    position.withdrawnAt = now;
    
    // Additional logic for early withdrawal penalties would go here
    
    return this.stakingPositionRepository.save(position);
  }
  
  /**
   * Get all staking positions that need rewards processing
   * @returns List of positions needing processing
   */
  async getPositionsForRewardsProcessing(): Promise<StakingPosition[]> {
    const lastProcessingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    return this.stakingPositionRepository.find({
      where: {
        status: StakingStatus.ACTIVE,
        autoClaimEnabled: true,
        lastClaimTime: LessThan(lastProcessingCutoff),
      },
    });
  }
  
  /**
   * Process auto-claim rewards for eligible positions
   * @returns Processing results
   */
  async processAutoClaimRewards(): Promise<{ processed: number, successful: number, failed: number }> {
    const positions = await this.getPositionsForRewardsProcessing();
    let successful = 0;
    let failed = 0;
    
    for (const position of positions) {
      try {
        await this.claimRewards(position.userId, position.id);
        successful++;
      } catch (error) {
        this.logger.error(`Error processing rewards for position ${position.id}: ${error.message}`);
        failed++;
      }
    }
    
    return {
      processed: positions.length,
      successful,
      failed,
    };
  }
}