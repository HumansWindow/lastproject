import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShahiTokenService } from '../services/shahi-token.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';

@Injectable()
export class TokenExpiryTask {
  private readonly logger = new Logger(TokenExpiryTask.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly shahiToken: ShahiTokenService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredTokens() {
    try {
      const wallets = await this.walletRepository.find();
      for (const wallet of wallets) {
        try {
          await this.shahiToken.burnExpiredTokens(wallet.address);
          this.logger.log(`Checked expired tokens for wallet: ${wallet.address}`);
        } catch (error) {
          this.logger.error(`Error checking wallet ${wallet.address}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to check expired tokens:', error);
    }
  }
}
