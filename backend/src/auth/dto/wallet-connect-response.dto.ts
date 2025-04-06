import { ApiProperty } from '@nestjs/swagger';

export class WalletConnectResponseDto {
  @ApiProperty({
    description: 'Whether an account exists for this wallet address',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Challenge to be signed by the wallet',
    example: 'Sign this message to authenticate with AliveHuman: 1714308000000',
  })
  challenge: string;
}
