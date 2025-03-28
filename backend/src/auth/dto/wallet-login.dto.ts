import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString, IsEmail, IsOptional, ValidateIf } from 'class-validator';

export class WalletLoginDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0xD2D53A3E16cf5dd2634Dd376bDc7CE81bD0F76Ff',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Message that was signed (challenge)',
    example: 'Sign this message to authenticate with AliveHuman: 1714308000000',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Signature created by wallet',
    example: '0x5f7a0a4b2c3...',
  })
  @IsString()
  signature: string;
  
  @ApiProperty({
    description: 'Optional email address for the user',
    example: 'user@example.com',
    required: false,
  })
  @ValidateIf(o => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail()
  @IsOptional()
  email?: string;
}
