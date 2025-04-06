import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { TestAppModule } from './test-app.module';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { RefreshToken } from '../auth/dto/refresh-token.entity';
import { ReferralCode } from '../referral/entities/referral-code.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

// Singleton app instance for tests
let app: INestApplication = null;

export async function getTestApp(): Promise<INestApplication> {
  if (!app) {
    // Create a completely isolated test module with mock entities
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  }
  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}

export function createTestingModule() {
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [User, Wallet, RefreshToken, ReferralCode], // Ensure all entities are included
        synchronize: true,
        dropSchema: true,
      }),
      // ...other imports
    ],
    // ...other configuration
  });
}
