import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { MailModule } from '../mail/mail.module';
import { ReferralModule } from '../referral/referral.module';
import { NftModule } from '../nft/nft.module';
import { DiaryModule } from '../diary/diary.module';
import { ProfileModule } from '../profile/profile.module';
import { BaseController } from './controllers/base.controller';
import { MemoryMonitorService } from '../shared/services/memory-monitor.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: parseInt(configService.get('DB_PORT')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // Disable schema synchronization
        logging: configService.get('DB_LOGGING') === 'true',
        ssl: configService.get('DB_SSL') === 'true',
        migrationsRun: false, // Disable migrations auto-run  
        dropSchema: false, // Never drop schema
        keepConnectionAlive: true,
        schema: 'public',
        entitySkipConstructor: true,
        // Skip schema sync and validation
        extra: {
          max: 10, // connection pool settings
          skipSchemaSync: true,
          skipTableCreation: true
        }
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    SharedModule,
    WalletsModule,
    BlockchainModule,
    MailModule,
    ReferralModule,
    NftModule,
    DiaryModule, // Added our new DiaryModule
    ProfileModule, // Added the new Profile module
  ],
  controllers: [BaseController],
  providers: [MemoryMonitorService],
})
export class AppModule {}
