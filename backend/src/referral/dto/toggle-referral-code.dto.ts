import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleReferralCodeDto {
  @ApiProperty({
    description: 'Active status of the referral code',
    example: true
  })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
