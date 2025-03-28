import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123', description: 'User password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  password: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'referrer-id', description: 'Referrer ID', required: false })
  @IsString()
  @IsOptional()
  referrerId?: string;
}
