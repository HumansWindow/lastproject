import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../../users/users.service';
import { ShahiTokenService } from '../services/shahi-token.service';

@Injectable()
export class TokenExpiryTask {
  private readonly logger = new Logger(TokenExpiryTask.name);
  
  constructor(
    private readonly usersService: UsersService,
    private readonly shahiTokenService: ShahiTokenService,
  ) {}
  
  /**
   * Check for and burn expired tokens once per day at midnight
   * This is more efficient than the on-chain approach which requires checking many timestamps
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndBurnExpiredTokens() {
    this.logger.log('Starting scheduled token expiry check');
    
    try {
      // Get all users with expired tokens
      const usersWithExpiredTokens = await this.usersService.getUsersWithExpiredTokens();
      this.logger.log(`Found ${usersWithExpiredTokens.length} users with expired tokens`);
      
      if (usersWithExpiredTokens.length === 0) {
        return;
      }
      
      // Process in larger batches of 100 for better efficiency
      const batchSize = 100; // Increased from 20 to 100
      for (let i = 0; i < usersWithExpiredTokens.length; i += batchSize) {
        const batch = usersWithExpiredTokens.slice(i, i + batchSize);
        const addressBatch = batch.map(user => user.walletAddress).filter(Boolean) as string[];
        
        try {
          // Use the new batch burn function to process multiple users at once
          if (addressBatch.length > 0) {
            const txHash = await this.shahiTokenService.batchBurnExpiredTokens(addressBatch);
            this.logger.log(`Batch burned tokens for ${addressBatch.length} users. Tx: ${txHash}`);
            
            // Mark each user's tokens as processed in our database
            for (const user of batch) {
              if (user.walletAddress) {
                await this.usersService.resetExpiredTokenTracking(user.walletAddress);
              }
            }
          }
        } catch (error) {
          this.logger.error(`Failed to burn batch of tokens: ${error.message}`, error.stack);
          
          // Fall back to individual processing if batch fails
          for (const user of batch) {
            if (!user.walletAddress) continue;
            
            try {
              await this.shahiTokenService.burnExpiredTokens(user.walletAddress);
              await this.usersService.resetExpiredTokenTracking(user.walletAddress);
              this.logger.log(`Individually burned tokens for user ${user.walletAddress}`);
            } catch (individualError) {
              this.logger.error(
                `Failed to burn tokens for user ${user.walletAddress}: ${individualError.message}`,
                individualError.stack,
              );
            }
          }
        }
        
        // Wait a bit between batches to avoid network congestion
        if (i + batchSize < usersWithExpiredTokens.length) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      this.logger.log('Completed token expiry processing');
    } catch (error) {
      this.logger.error(`Error in token expiry task: ${error.message}`, error.stack);
    }
  }
}
