import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserDevice } from './entities/user-device.entity';
import { UserSession } from './entities/user-session.entity';
import { UserDevicesService } from './services/user-devices.service';
import { UserSessionsService } from './services/user-sessions.service';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../shared/shared.module';
import { UserDevicesController } from './controllers/user-devices.controller';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDevice, UserSession, Wallet]),
    ConfigModule,
    SharedModule
  ],
  providers: [UsersService, UserDevicesService, UserSessionsService],
  controllers: [UsersController, UserDevicesController],
  exports: [UsersService, UserDevicesService, UserSessionsService, TypeOrmModule],
})
export class UsersModule {}
