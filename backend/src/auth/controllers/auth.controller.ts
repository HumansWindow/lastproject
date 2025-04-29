import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { TokenService } from '../services/token.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}
  
  // ...existing code...
  
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    this.logger.log('Refresh token request received');
    return this.tokenService.refreshTokens(refreshTokenDto.refreshToken);
  }
}