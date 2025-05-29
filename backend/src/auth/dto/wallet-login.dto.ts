import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString, IsEmail, IsOptional, Matches, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class WalletLoginDto {
  @ApiProperty({
    description: 'Wallet address of the user (Ethereum or Binance)',
    example: '0x123456789abcdef... or bnb1...'
  })
  // Allow either Ethereum addresses or Binance addresses
  @Matches(/^(0x[a-fA-F0-9]{40}|bnb1[a-zA-Z0-9]{38})$/i, {
    message: 'Wallet address must be a valid Ethereum or Binance address'
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Normalize Ethereum addresses to lowercase
    if (value && value.startsWith('0x')) {
      return value.toLowerCase();
    }
    return value;
  })
  walletAddress?: string;

  @ApiProperty({
    description: 'Alternative field name for wallet address (for API compatibility)',
    example: '0x123456789abcdef... or bnb1...',
    required: false
  })
  @Matches(/^(0x[a-fA-F0-9]{40}|bnb1[a-zA-Z0-9]{38})$/i, {
    message: 'Address must be a valid Ethereum or Binance address'
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Normalize Ethereum addresses to lowercase
    if (value && value.startsWith('0x')) {
      return value.toLowerCase();
    }
    return value;
  })
  address?: string;

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
  
  @ApiProperty({
    description: 'Device ID for multi-device management',
    example: 'device-123456',
    required: false
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
  
  @ApiProperty({
    description: 'Device information for security purposes',
    example: '{ "browser": "Chrome", "os": "Windows" }',
    required: false
  })
  @IsOptional()
  deviceInfo?: any;
  
  @ApiProperty({
    description: 'Used for testing only. Set to true to bypass certain validations',
    required: false
  })
  @IsOptional()
  isTest?: boolean;
  
  @ApiProperty({
    description: 'Blockchain type (e.g. ethereum, polygon, binance)',
    example: 'polygon',
    required: false
  })
  @IsString()
  @IsOptional()
  blockchain?: string;
}
