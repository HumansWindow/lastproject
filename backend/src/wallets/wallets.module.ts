import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet])],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [TypeOrmModule, WalletsService],
})
export class WalletsModule {}
