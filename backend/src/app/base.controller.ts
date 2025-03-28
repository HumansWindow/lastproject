import { Controller, Get } from '@nestjs/common';

@Controller()
export class BaseController {
  @Get()
  getHello(): string {
    return 'AliveHuman API is running!';
  }
}
