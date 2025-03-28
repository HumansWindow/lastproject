import { Controller, Get } from '@nestjs/common';

@Controller('nft')
export class NftController {
  @Get()
  findAll() {
    return 'Placeholder NFT controller';
  }
}
