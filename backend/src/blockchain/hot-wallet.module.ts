import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import HotWallet from './hotwallet';
import { HOTWALLET_CONFIG_TOKEN, HOTWALLET_TOKEN } from './constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Wallet])
  ],
  providers: [
    {
      provide: HOTWALLET_CONFIG_TOKEN,
      useFactory: (configService: ConfigService) => ({
        ETH_RPC_URL: configService.get<string>('ETH_RPC_URL'),
        BNB_RPC_URL: configService.get<string>('BNB_RPC_URL'),
        SOL_RPC_URL: configService.get<string>('SOL_RPC_URL'),
        MATIC_RPC_URL: configService.get<string>('MATIC_RPC_URL'),
        encryptPrivateKeys: true,
        encryptionKey: configService.get<string>('WALLET_ENCRYPTION_KEY'),
        // Add additional required configurations
        secureMode: configService.get<boolean>('SECURE_MODE', false),
        rateLimitOpsPerMin: configService.get<number>('RATE_LIMIT_OPS_PER_MIN', 60),
        maxBalances: {
          ETH: configService.get<number>('MAX_BALANCE_ETH', 10),
          BTC: configService.get<number>('MAX_BALANCE_BTC', 1),
          SOL: configService.get<number>('MAX_BALANCE_SOL', 500),
          BNB: configService.get<number>('MAX_BALANCE_BNB', 50),
          MATIC: configService.get<number>('MAX_BALANCE_MATIC', 10000)
        }
      }),
      inject: [ConfigService],
    },
    {
      provide: HOTWALLET_TOKEN,
      useFactory: async (config: any, configService: ConfigService) => {
        const wallet = new HotWallet(config);
        // Initialize the wallet with additional setup if needed
        await wallet.monitorAddress('ETH', configService.get('ADMIN_WALLET_ADDRESS'));
        return wallet;
      },
      inject: [HOTWALLET_CONFIG_TOKEN, ConfigService],
    }
  ],
  exports: [HOTWALLET_TOKEN],
})
export class HotWalletModule {}
