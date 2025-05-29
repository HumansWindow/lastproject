import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSession } from '../../users/entities/user-session.entity';
import { UserDevice } from '../../users/entities/user-device.entity';
import { SharedModule } from '../../shared/shared.module';
import { SessionSecurityService } from '../services/session-security.service';
import { SessionSecurityGuard } from '../guards/session-security.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSession, UserDevice]),
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
    SharedModule,
  ],
  providers: [SessionSecurityService, SessionSecurityGuard],
  exports: [SessionSecurityService, SessionSecurityGuard],
})
export class SessionSecurityModule {}