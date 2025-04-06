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

  @Get('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async verifyEmail(@Query('token') token: string) {
    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      this.logger.error(`Email verification error: ${error.message}`);
      // Keep original error if it's an HTTP exception
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Unable to verify email. Please try again or request a new verification link.');
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
