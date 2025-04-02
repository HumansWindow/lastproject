import { Module, forwardRef, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Wallet } from '../wallets/entities/wallet.entity';
import { BlockchainService } from './blockchain.service';
import { ShahiTokenService } from './services/shahi-token.service';
import { MintingService } from './services/minting.service';
import { MintingController } from './controllers/minting.controller';
import { TokenExpiryTask } from './tasks/token-expiry.task';
import { SharedModule } from '../shared/shared.module';
import { MerkleService } from './services/merkle.service';
import { User } from '../users/entities/user.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TokenEventsGateway } from './gateways/token-events.gateway';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { JwtSharedModule } from '../auth/jwt.module';
import { AuthModule } from '../auth/auth.module';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { WalletsModule } from '../wallets/wallets.module';
import { createBlockchainConfig, DEFAULT_RPC_URLS, getBlockchainConfig } from './config/blockchain-environment';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from '../users/users.module';
// Fixed imports with correct casing and paths
import { StakingService } from './services/staking.service';
import { StakingController } from './controllers/staking.controller';
import { TokenController } from './controllers/token.controller';
import { DeviceDetectorModule } from '../shared/modules/device-detector.module';
import { AccountsModule } from '../accounts/accounts.module';
import { StakingPosition } from './entities/staking-position.entity';
import { ApyTier } from './entities/apy-tier.entity';
import { MintingRecord } from './entities/minting-record.entity';
import { MintingQueueItem } from './entities/minting-queue-item.entity';
import { UserMintingQueueService } from './services/user-minting-queue.service';
import { TokenMintingController } from './controllers/token-minting.controller';

// Load blockchain-specific environment variables
const blockchainEnvPath = path.resolve(__dirname, 'hotwallet', '.env');
if (fs.existsSync(blockchainEnvPath)) {
  dotenv.config({ path: blockchainEnvPath });
  console.log(`Loaded blockchain environment from ${blockchainEnvPath}`);
}

// Make module global to ensure single instance of services
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', 'backend/.env', 'blockchain/.env'],
      isGlobal: true, // Make config global
      load: [getBlockchainConfig],
    }),
    TypeOrmModule.forFeature([Wallet, User, StakingPosition, ApyTier, MintingRecord, MintingQueueItem]),
    forwardRef(() => WalletsModule),
    forwardRef(() => AuthModule),
    ScheduleModule.forRoot(),
    SharedModule,
    EventEmitterModule.forRoot(),
    JwtSharedModule,
    HttpModule,
    UsersModule,
    DeviceDetectorModule,
    AccountsModule,
  ],
  providers: [
    {
      provide: 'BLOCKCHAIN_CONFIG',
      useFactory: (configService: ConfigService) => {
        // Create a consistent blockchain config that will be used across services
        const config = createBlockchainConfig({
          ETH_RPC_URL: configService.get<string>('ETH_RPC_URL'),
          BNB_RPC_URL: configService.get<string>('BNB_RPC_URL'),
          SOL_RPC_URL: configService.get<string>('SOL_RPC_URL'),
          MATIC_RPC_URL: configService.get<string>('MATIC_RPC_URL'),
          encryptPrivateKeys: configService.get<boolean>('ENCRYPT_PRIVATE_KEYS') || false,
          encryptionKey: configService.get<string>('ENCRYPTION_KEY') || 'default-encryption-key-for-development',
          TOKEN_CONTRACT_ADDRESS: configService.get<string>('TOKEN_CONTRACT_ADDRESS'),
          ADMIN_PRIVATE_KEY: configService.get<string>('ADMIN_PRIVATE_KEY'),
        });
        
        console.log('Blockchain configuration initialized with:', {
          ETH: config.ETH_RPC_URL ? 'provided' : 'default',
          BNB: config.BNB_RPC_URL ? 'provided' : 'default',
          SOL: config.SOL_RPC_URL ? 'provided' : 'default',
          MATIC: config.MATIC_RPC_URL ? 'provided' : 'default',
          TokenContract: 'TOKEN_CONTRACT_ADDRESS' in config ? 'provided' : 'missing'
        });
        
        return config;
      },
      inject: [ConfigService]
    },
    BlockchainService,
    ShahiTokenService,
    MintingService,
    TokenExpiryTask,
    MerkleService,
    TokenEventsGateway,
    WsAuthGuard,
    StakingService,
    UserMintingQueueService,
  ],
  controllers: [MintingController, TokenController, StakingController, TokenMintingController],
  exports: [
    'BLOCKCHAIN_CONFIG', // Export the config provider
    BlockchainService,
    ShahiTokenService,
    MerkleService,
    StakingService,
    UserMintingQueueService,
  ],
})
export class BlockchainModule {
  constructor(private configService: ConfigService) {
    // Initialize global blockchain config on module creation
    const configFromEnv = {
      ETH_RPC_URL: configService.get<string>('ETH_RPC_URL'),
      BNB_RPC_URL: configService.get<string>('BNB_RPC_URL'),
      SOL_RPC_URL: configService.get<string>('SOL_RPC_URL'),
      MATIC_RPC_URL: configService.get<string>('MATIC_RPC_URL'),
      TOKEN_CONTRACT_ADDRESS: configService.get<string>('TOKEN_CONTRACT_ADDRESS')
    };
    
    // Ensure the global blockchain config is initialized
    createBlockchainConfig(configFromEnv);
    
    console.log('BlockchainModule initialized');
  }
}
