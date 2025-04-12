import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'User email (optional with wallet auth)' })
  @IsEmail()
  @IsOptional() // Made optional to support wallet-only authentication
  email?: string;

  @ApiPropertyOptional({ description: 'User password (optional with wallet auth)' })
  @MinLength(6)
  @IsString()
  @IsOptional() // Made optional to support wallet-only authentication
  password?: string;

  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Referral code' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Wallet address' })
  @IsOptional()
  @IsString()
  walletAddress?: string;
}
