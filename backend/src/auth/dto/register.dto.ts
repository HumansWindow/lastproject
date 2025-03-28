import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the account',
    example: 'johndoe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Email address for the account',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the account (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must include uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({
    description: 'First name (optional)',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name (optional)',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Referral code (optional)',
    example: 'ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({
    description: 'Device ID for security tracking',
    example: 'd8f3a7e2-9b56-4c1a-a2e0-1234567890ab',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
