import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { WalletStrategy } from './strategies/wallet.strategy';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { ReferralModule } from '../referral/referral.module';
import { MailModule } from '../mail/mail.module';
import { SharedModule } from '../shared/shared.module';
import { WalletsModule } from '../wallets/wallets.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { WalletAuthController } from './controllers/wallet-auth.controller';
import { WalletAuthDebugController } from './controllers/wallet-auth-debug.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Wallet]),
    forwardRef(() => UsersModule),
    forwardRef(() => WalletsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    ReferralModule,
    MailModule,
    SharedModule,
    forwardRef(() => BlockchainModule),
    WalletsModule,
  ],
  controllers: [AuthController, WalletAuthController, WalletAuthDebugController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    WalletStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
