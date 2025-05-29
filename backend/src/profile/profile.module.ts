import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // Fixed import for HttpModule
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User } from '../users/entities/user.entity';
import { ProfileErrorHandlerService } from './profile-error-handler.service';
import { GeoLocationService } from './geo-location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, User]),
    HttpModule,
    ConfigModule
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileErrorHandlerService, GeoLocationService],
  exports: [ProfileService, ProfileErrorHandlerService, GeoLocationService],
})
export class ProfileModule {}