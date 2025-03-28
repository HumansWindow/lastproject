import { ApiProperty } from '@nestjs/swagger';

export class WalletConnectResponseDto {
  @ApiProperty({
    description: 'Whether the user already exists in the system',
    example: 'false'
  })
  exists: boolean;

  @ApiProperty({
    description: 'Challenge message that needs to be signed by the wallet',
    example: 'Sign this message to authenticate with AliveHuman: 1714308000000'
  })
  challenge: string;
}
