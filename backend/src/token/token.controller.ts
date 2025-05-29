import { Controller, Get, Post, Body, UseGuards, Req, Logger, UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller('token')
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(private readonly tokenService: TokenService) {}

  @Get()
  findAll() {
    return 'Token management endpoints';
  }

  @Public()
  @Post('verify')
  verifyToken(@Body() body: { token: string }) {
    if (!body.token) {
      throw new UnauthorizedException('No token provided');
    }

    const decodedToken = this.tokenService.decodeToken(body.token);
    
    if (!decodedToken) {
      throw new UnauthorizedException('Invalid token format');
    }
    
    // First, try to verify as access token
    const verifiedAccessToken = this.tokenService.verifyAccessToken(body.token);
    if (verifiedAccessToken) {
      return {
        valid: true,
        type: 'access',
        payload: verifiedAccessToken
      };
    }
    
    // If not a valid access token, try as refresh token
    const verifiedRefreshToken = this.tokenService.verifyRefreshToken(body.token);
    if (verifiedRefreshToken) {
      return {
        valid: true,
        type: 'refresh',
        payload: verifiedRefreshToken
      };
    }
    
    // If neither, return decoded but marked as invalid
    return {
      valid: false,
      decoded: decodedToken
    };
  }
  
  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  testAuth(@Req() req: Request) {
    this.logger.debug('Authentication test successful - user object:', req.user);
    return { 
      status: 'success',
      message: 'Authentication successful',
      user: req.user
    };
  }

  @Public()
  @Post('debug')
  async debugToken(@Body() body: { token: string }) {
    const { token } = body;
    
    if (!token) {
      return { error: 'No token provided' };
    }
    
    // Try to decode without verification
    const decoded = this.tokenService.decodeToken(token);
    
    if (!decoded) {
      return { error: 'Could not decode token - invalid format' };
    }
    
    // Perform a series of checks for diagnostics
    try {
      const diagnosticInfo = {
        format: {
          isValidJwt: token.split('.').length === 3,
          hasValidHeader: true,
        },
        content: {
          sub: decoded['sub'],
          exp: decoded['exp'] ? new Date(decoded['exp'] * 1000).toISOString() : null,
          iat: decoded['iat'] ? new Date(decoded['iat'] * 1000).toISOString() : null,
        },
        validation: {
          isExpired: decoded['exp'] ? (decoded['exp'] * 1000) < Date.now() : 'unknown',
          accessTokenVerification: null,
          refreshTokenVerification: null
        }
      };
      
      // Now try verification
      try {
        const verifiedAccess = this.tokenService.verifyAccessToken(token);
        diagnosticInfo.validation.accessTokenVerification = verifiedAccess ? 'success' : 'failed';
      } catch (e) {
        diagnosticInfo.validation.accessTokenVerification = `error: ${e.message}`;
      }
      
      try {
        const verifiedRefresh = this.tokenService.verifyRefreshToken(token);
        diagnosticInfo.validation.refreshTokenVerification = verifiedRefresh ? 'success' : 'failed';
      } catch (e) {
        diagnosticInfo.validation.refreshTokenVerification = `error: ${e.message}`;
      }
      
      return {
        decoded,
        diagnostics: diagnosticInfo
      };
    } catch (error) {
      this.logger.error(`Error in token debug: ${error.message}`);
      return {
        error: error.message,
        decoded
      };
    }
  }
}
