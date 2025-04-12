import { ApiProperty } from '@nestjs/swagger';

export class WalletConnectResponseDto {
  @ApiProperty({
    description: 'The normalized wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678'
  })
  address: string;

  @ApiProperty({
    description: 'Challenge to be signed by the wallet',
    example: 'Sign this message to authenticate with AliveHuman: 1714308000000'
  })
  challenge: string;

  @ApiProperty({
    description: 'Timestamp when the challenge was created',
    example: 1714308000000
  })
  timestamp: number;

  @ApiProperty({
    description: 'Whether an account exists for this wallet address',
    example: true,
    required: false
  })
  isExistingUser?: boolean;
}
