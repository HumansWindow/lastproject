import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral, ReferralUse } from './entities/referral.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, ReferralUse, ReferralCode]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
