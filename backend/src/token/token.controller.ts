import { Controller, Get } from '@nestjs/common';

@Controller('token')
export class TokenController {
  @Get()
  findAll() {
    return 'Placeholder Token controller';
  }
}
