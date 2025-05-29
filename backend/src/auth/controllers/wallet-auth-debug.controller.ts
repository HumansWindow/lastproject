import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Headers, 
  HttpStatus, 
  HttpException, 
  UseGuards, 
  Req, 
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SkipSessionCheck } from '../decorators/skip-session-check.decorator';

// Define the expected user structure from JWT token
interface JwtUser {
  id?: string;
  sub?: string;  // JWT standard for subject (usually user ID)
  walletAddress?: string;
  email?: string;
}

/**
 * Debug controller for wallet authentication
 * Only enabled in test and development environments
 */
@ApiTags('Wallet Auth Debug')
@Controller('auth/wallet-debug')
@UseInterceptors(ClassSerializerInterceptor)
@SkipSessionCheck()  // Skip session check for all debug endpoints
export class WalletAuthDebugController {
  private readonly logger = new Logger(WalletAuthDebugController.name);
  private isDebugEnabled: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    // Only enable in test/development environments
    const env = this.configService.get<string>('NODE_ENV');
    this.isDebugEnabled = env === 'development' || env === 'test';
    
    if (this.isDebugEnabled) {
      this.logger.warn('⚠️ Wallet authentication debug endpoints are ENABLED. This should NOT be used in production!');
    }
  }

  @Post('verify-signature')
  @ApiOperation({ summary: 'Verify an Ethereum signature' })
  async verifySignature(@Body() body: { address: string; message: string; signature: string }) {
    const { address, message, signature } = body;
    try {
      // Update to use three separate parameters instead of a single object
      const verified = await this.authService.verifyWalletSignature(address, message, signature);
      return { isValid: verified };
    } catch (error) {
      throw new HttpException(`Signature verification error: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('request-info')
  @ApiOperation({ summary: 'Get request information for debugging' })
  getRequestInfo(@Req() req: Request) {
    return {
      headers: req.headers,
      ip: req.ip,
      ips: req.ips,
      protocol: req.protocol,
      secure: req.secure,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString()
    };
  }

  @Post('mock-authenticate')
  @ApiOperation({ summary: 'Authenticate without signature verification (test only)' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async mockAuthenticate(@Body() body: { walletAddress: string }, @Req() req: Request) {
    try {
      if (!this.configService.get<boolean>('BYPASS_WALLET_SIGNATURE', false)) {
        throw new HttpException('Mock authentication is disabled in this environment', HttpStatus.FORBIDDEN);
      }

      const { walletAddress } = body;
      if (!walletAddress || !walletAddress.startsWith('0x')) {
        throw new HttpException('Invalid wallet address format', HttpStatus.BAD_REQUEST);
      }

      // Just pass a dummy signature - it will be bypassed with BYPASS_WALLET_SIGNATURE=true
      const result = await this.authService.authenticateWallet({
        walletAddress,
        signature: 'mock_signature_for_testing',
        message: `I am signing this message to authenticate with the platform. Wallet address: ${walletAddress}. Timestamp: ${Date.now()}`
      }, req);

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Mock authentication failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health-check')
  @ApiOperation({ summary: 'Check if debug endpoints are enabled' })
  @ApiResponse({ status: 200, description: 'Debug status' })
  healthCheck() {
    return {
      enabled: true,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      bypassSignature: this.configService.get<boolean>('BYPASS_WALLET_SIGNATURE', false),
      skipTokenStorage: this.configService.get<boolean>('SKIP_REFRESH_TOKEN_STORAGE', false),
      timestamp: new Date().toISOString()
    };
  }

  @Get('endpoints')
  @ApiOperation({ summary: 'List available auth endpoints for testing' })
  @ApiResponse({ status: 200, description: 'List of endpoints' })
  listEndpoints() {
    return {
      healthCheck: '/auth/wallet-debug/health-check',
      verifySignature: '/auth/wallet-debug/verify-signature',
      mockAuthenticate: '/auth/wallet-debug/mock-authenticate',
      requestInfo: '/auth/wallet-debug/request-info',
      verifyToken: '/auth/wallet-debug/verify-token',
      validateToken: '/auth/wallet-debug/validate-token',
      userInfo: '/auth/wallet-debug/user-info',
    };
  }

  @Get('verify-token')
  @ApiOperation({ summary: 'Verify and decode a JWT token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyToken(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Authorization header must be in format "Bearer token"', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // No verification - just decode
      const decoded = this.jwtService.decode(token);
      
      // Also attempt verification with the secret key
      try {
        const verified = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET')
        });
        return { 
          valid: true, 
          decoded,
          verified: true
        };
      } catch (verifyError) {
        // Return decoded payload but note that verification failed
        return { 
          valid: false, 
          decoded, 
          verified: false,
          verificationError: verifyError.message
        };
      }
    } catch (error) {
      throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('user-info')
  @ApiOperation({ summary: 'Get user info from token' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async getUserInfo(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Authorization header must be in format "Bearer token"', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Decode the token without verification to get user ID
      const decoded = this.jwtService.decode(token) as any;
      
      if (!decoded || !decoded.sub) {
        throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
      }
      
      try {
        // Try to get user info (will fail if user not found)
        const userProfile = await this.authService.getUserProfileInfo(decoded.sub);
        return {
          user: userProfile,
          token: {
            sub: decoded.sub,
            role: decoded.role,
            iat: decoded.iat,
            exp: decoded.exp,
          }
        };
      } catch (userError) {
        // Return just the token data without user info
        return {
          error: 'User not found in database, but token is decodable',
          token: {
            sub: decoded.sub,
            role: decoded.role,
            iat: decoded.iat,
            exp: decoded.exp,
          }
        };
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Failed to get user info: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-token')
  @ApiOperation({ summary: 'Verify and decode a JWT token (POST method)' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyTokenPost(@Body() body: { token: string }) {
    const { token } = body;
    
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.UNAUTHORIZED);
    }
    
    try {
      // No verification - just decode
      const decoded = this.jwtService.decode(token);
      
      // Also attempt verification with the secret key
      try {
        const verified = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET')
        });
        return { 
          valid: true, 
          decoded,
          verified: true
        };
      } catch (verifyError) {
        // Return decoded payload but note that verification failed
        return { 
          valid: false, 
          decoded, 
          verified: false,
          verificationError: verifyError.message
        };
      }
    } catch (error) {
      throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('debug-endpoints')
  @ApiOperation({ summary: 'List available auth endpoints for testing' })
  @ApiResponse({ status: 200, description: 'List of endpoints' })
  listDebugEndpoints() {
    return this.listEndpoints();
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Alternative endpoint to verify tokens' })
  @ApiResponse({ status: 200, description: 'Token validated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Body() body: { token: string }) {
    return this.verifyTokenPost(body);
  }

  @Get('status')
  @ApiOperation({ summary: 'Alternative endpoint to check service status' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  checkStatus() {
    return this.healthCheck();
  }

  @Post('debug/authenticate')
  @ApiOperation({ summary: 'Debug wallet authentication' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async debugAuthenticate(
    @Body() walletLoginDto: WalletLoginDto,
    @Req() req: Request
  ) {
    try {
      return await this.authService.authenticateWallet(walletLoginDto, req);
    } catch (error) {
      // Return detailed error for debugging
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        name: error.name,
      };
    }
  }
}
