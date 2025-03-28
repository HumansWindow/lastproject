import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './mocks/user.entity.mock';
import { Wallet } from './mocks/wallet.entity.mock';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Wallet],
      synchronize: true,
    }),
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, Wallet]),
  ],
  controllers: [],
  providers: [],
})
export class TestAppModule {}
