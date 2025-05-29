import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TokenTransaction } from './entities/token-transaction.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtSharedModule } from '../auth/jwt.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenTransaction, RefreshToken]), 
    ConfigModule,
    JwtSharedModule, // Import the JwtSharedModule to have access to JwtService
  ],
  providers: [TokenService],
  controllers: [TokenController],
  exports: [TokenService, JwtSharedModule], // Also export JwtSharedModule for other modules that import TokenModule
})
export class TokenModule {}
