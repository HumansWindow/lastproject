import { Controller, Get, UseGuards, Req, Post, Body, Logger } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../auth.service';

// Define the expected user structure from JWT token
interface JwtUser {
  id?: string;
  sub?: string;  // JWT standard for subject (usually user ID)
  walletAddress?: string;
  email?: string;
}

@Controller('auth/wallet-debug')
export class WalletAuthDebugController {
  private readonly logger = new Logger(WalletAuthDebugController.name);
  
  constructor(private readonly authService: AuthService) {}
  
  @Get('user-info')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@Req() req: Request) {
    const user = req.user as JwtUser;
    return {
      userId: user.id || user.sub,  // Use id or sub (subject) from JWT
      walletAddress: user.walletAddress || 'Not available',
      authenticated: true,
      timestamp: new Date().toISOString()
    };
  }
  
  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: Request) {
    // This endpoint will only be accessible with a valid token
    const user = req.user as JwtUser;
    return {
      verified: true,
      tokenData: user,
      timestamp: new Date().toISOString()
    };
  }
  
  @Post('mock-authenticate')
  async mockAuthenticate(@Body() body: { address: string }) {
    this.logger.log(`Debug mock authentication for wallet: ${body.address}`);
    
    // Generate mock tokens for testing
    const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJ3YWxsZXRBZGRyZXNzIjoiMHgxMjM0NTY3ODkwIiwiaWF0IjoxNjE3MjQ5MDIyLCJleHAiOjE2MTczMzU0MjJ9.mock-signature';
    const mockRefreshToken = 'mock-refresh-token-' + Date.now();
    
    return {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      user: {
        id: 'test-user-id',
        walletAddress: body.address
      }
    };
  }
  
  @Get('health-check')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      debugEnabled: true
    };
  }
  
  @Get('endpoints')
  async listEndpoints() {
    return {
      availableEndpoints: [
        '/auth/wallet-debug/verify-token',
        '/auth/wallet-debug/user-info',
        '/auth/wallet-debug/mock-authenticate',
        '/auth/wallet-debug/health-check',
        '/auth/wallet-debug/endpoints'
      ],
      timestamp: new Date().toISOString()
    };
  }
}