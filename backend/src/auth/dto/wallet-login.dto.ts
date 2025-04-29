import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class WalletLoginDto {
  @ApiProperty({
    description: 'Wallet address of the user',
    example: '0x123456789abcdef...'
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({
    description: 'Signature from the wallet',
    example: '0xabcdef...'
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Message that was signed',
    example: 'Sign this message to authenticate with app.shahi.io...'
  })
  @IsString()
  @IsNotEmpty()
  message: string;
  
  @ApiProperty({
    description: 'Optional email address to associate with the wallet',
    example: 'user@example.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}
