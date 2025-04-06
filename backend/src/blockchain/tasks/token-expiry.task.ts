import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShahiTokenService } from '../services/shahi-token.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Repository, IsNull, Not } from 'typeorm';

@Injectable()
export class TokenExpiryTask {
  private readonly logger = new Logger(TokenExpiryTask.name);
  private isRunning = false;

  constructor(
    private readonly shahiTokenService: ShahiTokenService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Run at midnight every day
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredTokens() {
    if (this.isRunning) {
      this.logger.warn('Token expiry task is already running, skipping this execution');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('Starting token expiry check task');

      // Get all wallet addresses from users
      const users = await this.userRepository.find({
        select: ['walletAddress'],
        where: { walletAddress: Not(IsNull()) },
      });

      if (users.length > 0) {
        this.logger.log(`Found ${users.length} wallet addresses to check for expired tokens`);
        
        // Get unique wallet addresses
        const walletAddresses = [...new Set(users.map(user => user.walletAddress))];
        
        // Process in batches to avoid gas issues
        await this.shahiTokenService.batchBurnExpiredTokens(walletAddresses);
      } else {
        this.logger.log('No wallet addresses found to check for token expiry');
      }
    } catch (error) {
      this.logger.error(`Error in token expiry task: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
      this.logger.log('Token expiry check task completed');
    }
  }

  // Manual trigger method for testing or admin controls
  async manuallyTriggerExpiredTokensCheck(walletAddress: string) {
    this.logger.log(`Manually checking for expired tokens for wallet: ${walletAddress}`);
    
    try {
      const result = await this.shahiTokenService.burnExpiredTokens(walletAddress);
      return { success: true, transactionHash: result?.transactionHash };
    } catch (error) {
      this.logger.error(`Failed to manually burn expired tokens: ${error.message}`);
      throw error;
    }
  }
}
