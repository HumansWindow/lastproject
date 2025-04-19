import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  // Add a cache to track recent challenge requests per wallet address
  private readonly challengeCache = new Map<string, { challenge: string, timestamp: number, requestCount: number }>();
  // Cache expiry time: 15 minutes (in milliseconds)
  private readonly CHALLENGE_CACHE_EXPIRY = 15 * 60 * 1000;
  // Maximum request count per address in the expiry period
  private readonly MAX_CHALLENGE_REQUESTS = 5;
  // Minimum time between challenge requests (in milliseconds)
  private readonly MIN_CHALLENGE_INTERVAL = 2000; // 2 seconds

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data or email already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<any> {
    try {
      // Log registration attempt with limited data for debugging
      this.logger.log(`Registration attempt for email: ${registerDto.email.substring(0, 3)}...`);
      
      const result = await this.authService.register(registerDto, req);
      return result;
    } catch (error) {
      // Handle specific errors with appropriate status codes
      if (error.code === '23505') {  // PostgreSQL unique violation
        throw new ConflictException('Email already exists');
      }
      
      if (error instanceof BadRequestException || 
          error.message?.includes('validation')) {
        throw new BadRequestException(error.message);
      }
      
      // Log the full error for debugging but return a sanitized message
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Registration failed. Please try again later.');
    }
  }

  @Post('login')
  @HttpCode(200) // Changed from 201 to 200 to match test expectations
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<any> {
    return this.authService.login(loginDto, req);
  }

  @Post('wallet-login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with blockchain wallet' })
  @ApiResponse({ status: 200, description: 'User successfully logged in with wallet.' })
  @ApiResponse({ status: 401, description: 'Invalid signature.' })
  @ApiBody({ type: WalletLoginDto })
  walletLogin(@Body() walletLoginDto: WalletLoginDto, @Req() req: Request) {
    return this.authService.walletLogin(walletLoginDto, req);
  }

  // New endpoint for wallet connection (first step of wallet authentication)
  @Post('wallet/connect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a wallet authentication challenge' })
  @ApiResponse({ status: 200, description: 'Challenge generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Missing wallet address' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async walletConnect(@Body() body: { address: string }, @Req() req: Request) {
    try {
      // Generate a unique request ID for tracing
      const requestId = Math.random().toString(36).substring(2, 12);
      
      if (!body.address) {
        throw new BadRequestException('Wallet address is required');
      }
      
      // Normalize the address to lowercase
      const normalizedAddress = body.address.toLowerCase();
      
      this.logger.log(`[${requestId}] Wallet connection request received for address: ${normalizedAddress}`);
      
      // Check for rate limiting
      const now = Date.now();
      const cachedChallenge = this.challengeCache.get(normalizedAddress);
      
      if (cachedChallenge) {
        // If there's a recent request, check the time and count
        if (now - cachedChallenge.timestamp < this.MIN_CHALLENGE_INTERVAL) {
          this.logger.warn(`[${requestId}] Too frequent challenge requests for address: ${normalizedAddress}`);
          throw new BadRequestException('Please wait before requesting another challenge');
        }
        
        // If too many requests in cache expiry period
        if (cachedChallenge.requestCount >= this.MAX_CHALLENGE_REQUESTS) {
          this.logger.warn(`[${requestId}] Rate limit exceeded for address: ${normalizedAddress}`);
          throw new BadRequestException('Too many challenge requests. Please try again later.');
        }
        
        // Update the request count
        cachedChallenge.requestCount += 1;
        cachedChallenge.timestamp = now;
        this.challengeCache.set(normalizedAddress, cachedChallenge);
      } else {
        // First request for this address within the expiry period
        // We'll create the challenge and add it to cache
        const response = await this.authService.handleWalletConnect(normalizedAddress);
        
        // Cache the challenge
        this.challengeCache.set(normalizedAddress, {
          challenge: response.challenge,
          timestamp: now,
          requestCount: 1
        });
        
        // Clean up old cache entries periodically
        this.cleanupChallengeCache();
        
        return response;
      }
      
      // Get a new challenge from auth service
      return await this.authService.handleWalletConnect(normalizedAddress);
    } catch (error) {
      this.logger.error(`Wallet connection error: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to generate wallet challenge');
    }
  }

  // New endpoint for wallet authentication (second step after signing challenge)
  @Post('wallet/authenticate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  @ApiResponse({ status: 500, description: 'Authentication server error' })
  async walletAuthenticate(@Body() walletLoginDto: WalletLoginDto, @Req() req: Request) {
    const requestId = Math.random().toString(36).substring(2, 12);
    try {
      if (!walletLoginDto.address) {
        throw new BadRequestException('Wallet address is required');
      }
      
      // Normalize the address
      const normalizedAddress = walletLoginDto.address.toLowerCase();
      
      this.logger.log(`[${requestId}] Wallet authentication request received for address: ${normalizedAddress}`);
      
      // Check if we have a cached challenge for this address
      const cachedChallenge = this.challengeCache.get(normalizedAddress);
      
      if (!cachedChallenge) {
        this.logger.warn(`[${requestId}] No recent challenge found for address: ${normalizedAddress}`);
        // We'll still try to authenticate - the authService will validate the signature
      } else if (cachedChallenge.challenge !== walletLoginDto.message) {
        this.logger.warn(`[${requestId}] Submitted message doesn't match cached challenge for address: ${normalizedAddress}`);
        // We'll still try to authenticate - the authService will validate the signature
      }
      
      const result = await this.authService.authenticateWallet(walletLoginDto, req);
      
      // On successful authentication, clean up the cache entry for this address
      if (result && this.challengeCache.has(normalizedAddress)) {
        this.challengeCache.delete(normalizedAddress);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Wallet authentication error: ${error.message}`, error.stack);
      
      // Rethrow application-level exceptions
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Wallet authentication failed: ${error.message}`);
    }
  }

  // Helper method to clean up challenge cache
  private cleanupChallengeCache() {
    const now = Date.now();
    for (const [address, data] of this.challengeCache.entries()) {
      if (now - data.timestamp > this.CHALLENGE_CACHE_EXPIRY) {
        this.challengeCache.delete(address);
      }
    }
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists.' })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Verify a user's email
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      // Forward the error response from the service
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }
}
