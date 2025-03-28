import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity.mock';
import { BlockchainService } from './blockchain.service.mock';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet])],
  providers: [BlockchainService],
  exports: [TypeOrmModule, BlockchainService],
})
export class BlockchainModule {}
