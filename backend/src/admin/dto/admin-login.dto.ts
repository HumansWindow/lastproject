import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Username of the admin account',
    example: 'adminuser',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password for the admin account',
    example: 'securePassword123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}