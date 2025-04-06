import { Controller, Get, Param } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Wallet } from './entities/wallet.entity';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('user/:userId')
  async findAllByUser(@Param('userId') userId: string): Promise<Wallet[]> {
    return this.walletsService.findAllByUser(userId);
  }

  // Add other necessary endpoints
}
