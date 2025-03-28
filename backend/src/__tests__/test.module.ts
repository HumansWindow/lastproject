import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { RefreshToken } from '../auth/dto/refresh-token.entity';
import { ReferralCode } from '../referral/entities/referral-code.entity';
import { UserDevice } from '../users/entities/user-device.entity';
import { UserSession } from '../users/entities/user-session.entity';

// Mock services to avoid circular dependencies
const MockAuthService = {
  provide: 'AuthService',
  useValue: {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  },
};

const MockUsersService = {
  provide: 'UsersService',
  useValue: {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('TEST_DB_HOST', 'localhost'),
        port: configService.get('TEST_DB_PORT', 5432),
        username: configService.get('TEST_DB_USERNAME', 'postgres'),
        password: configService.get('TEST_DB_PASSWORD', 'postgres'),
        database: configService.get('TEST_DB_NAME', 'alivehuman_test'),
        entities: [User, Wallet, RefreshToken, ReferralCode, UserDevice, UserSession],
        synchronize: true, // Use with caution! This automatically creates database schema
        dropSchema: true, // This will drop the schema each time tests start
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Wallet, RefreshToken, ReferralCode, UserDevice, UserSession]),
  ],
  providers: [MockAuthService, MockUsersService],
  exports: [TypeOrmModule],
})
export class TestModule {}
