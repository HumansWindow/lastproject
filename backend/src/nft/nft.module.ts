import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NFT } from './entities/nft.entity';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { UsersModule } from '../users/users.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [TypeOrmModule.forFeature([NFT]), UsersModule, BlockchainModule],
  controllers: [NftController],
  providers: [NftService],
  exports: [NftService],
})
export class NftModule {}
