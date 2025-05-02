import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from './controllers/auth.controller';
import { AdminAuthService } from './services/auth.service';
import { UserManagementController } from './controllers/user-management.controller';
import { UserManagementService } from './services/user-management.service';
import { BlockchainMonitoringController } from './controllers/blockchain-monitoring.controller';
import { SystemMonitoringController } from './controllers/system-monitoring.controller';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { JwtSharedModule } from '../auth/jwt.module';
import { SharedModule } from '../shared/shared.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    JwtSharedModule,
    SharedModule,
    BlockchainModule, // Add blockchain module to access its services
  ],
  controllers: [
    AdminAuthController,
    UserManagementController,
    BlockchainMonitoringController,
    SystemMonitoringController,
  ],
  providers: [
    AdminAuthService,
    UserManagementService,
  ],
  exports: [
    AdminAuthService,
    UserManagementService,
  ]
})
export class AdminModule {}