import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { verifyMessage } from 'ethers/lib/utils';
import { User, UserRole } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ReferralService } from '../referral/referral.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { Request } from 'express';
import { DeviceDetectorService } from '../shared/services/device-detector.service';
import { UserDevicesService } from '../users/services/user-devices.service';
import { UserSessionsService } from '../users/services/user-sessions.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { BcryptService } from '../shared/services/bcrypt.service';
import { ShahiTokenService } from '../blockchain/services/shahi-token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ReferralService))
    private readonly referralService: ReferralService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    private readonly deviceDetectorService: DeviceDetectorService,
    private readonly userDevicesService: UserDevicesService,
    private readonly userSessionsService: UserSessionsService,
    private readonly bcryptService: BcryptService,
    @Inject(forwardRef(() => ShahiTokenService))
    private readonly shahiTokenService: ShahiTokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto, req: Request) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified. Please check your inbox.');
    }
    
    // Get device information
    const userAgent = req.headers['user-agent'];
    const ipAddress = this.getIpAddress(req);
    const deviceId = this.deviceDetectorService.generateDeviceId(userAgent, ipAddress);
    
    // Check if this device is already bound to another user account
    try {
      const devices = await this.userDevicesService.findByDeviceId(deviceId);
      
      if (Array.isArray(devices) && devices.length > 0) {
        // Check if any device belongs to a different user
        const hasDifferentUserOwner = devices.some(device => {
          return device.userId && device.userId !== user.id;
        });
        
        if (hasDifferentUserOwner) {
          this.logger.warn(`Login attempt with device already associated with another user. Device ID: ${deviceId}, User ID: ${user.id}`);
          throw new ForbiddenException('This device is already associated with another account');
        }
      }
    } catch (error) {
      // Log the error but don't block login if this check fails
      this.logger.error(`Error checking device association: ${error.message}`);
    }
    
    // Update user last login
    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    } as any);
    
    // Find or create device - Ensure this doesn't return void
    let existingDevice = null;
    try {
      existingDevice = await this.userDevicesService.findByUserIdAndDeviceId(user.id, deviceId);
    } catch (error) {
      this.logger.error(`Error finding user device: ${error.message}`);
    }
    
    if (existingDevice) {
      // Update device info
      await this.userDevicesService.update(existingDevice.id, {
        lastSeenAt: new Date(),
        lastIpAddress: ipAddress,
        visitCount: existingDevice.visitCount + 1,
        isActive: true,
      });
    } else {
      // Create new device record
      const deviceInfo = this.deviceDetectorService.detect(userAgent);
      await this.userDevicesService.create({
        userId: user.id,
        deviceId,
        deviceType: deviceInfo.deviceType,
        userAgent,
        name: deviceInfo.deviceName,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        lastIpAddress: ipAddress,
      });
    }
    
    // Create tokens
    const tokens = await this.getTokens(user.id);
    
    // Create session
    await this.userSessionsService.create({
      userId: user.id,
      deviceId,
      token: tokens.refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + this.getRefreshTokenExpiresInMs()),
    });
    
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto, req?: Request): Promise<any> {
    const { email, password, firstName, lastName } = registerDto;
    
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    
    // Get device info if available
    const deviceInfo = req ? this.deviceDetectorService.detect(req) : null;
    const deviceId = deviceInfo ? this.deviceDetectorService.generateDeviceId(req) : null;
    const userAgent = req ? req.headers['user-agent'] : null;
    
    // Check if we should bypass device verification
    const isDevelopmentMode = this.configService.get<string>('NODE_ENV') === 'development';
    const isTestMode = this.configService.get<string>('NODE_ENV') === 'test';
    const skipDeviceCheck = isDevelopmentMode || isTestMode || 
                          this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true';
    
    if (deviceId && !skipDeviceCheck) {
      // Production behavior: Strict device checking
      try {
        const existingDevices = await this.userDevicesService.findByDeviceId(deviceId);
        if (Array.isArray(existingDevices) && existingDevices.length > 0) {
          const deviceOwner = existingDevices[0]?.userId;
          this.logger.warn(`Registration attempt with device already associated with user ID: ${deviceOwner}`);
          throw new ForbiddenException('This device is already associated with another account');
        }
      } catch (error) {
        this.logger.error(`Error checking device association: ${error.message}`);
        // Continue registration but log the error
      }
    } else if (deviceId && skipDeviceCheck) {
      // Development behavior: Log but allow
      this.logger.warn(`Device check bypassed in ${this.configService.get<string>('NODE_ENV')} environment`);
    }
    
    // Hash the password
    const hashedPassword = await this.bcryptService.hash(password);
    
    // Create the user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });
    
    // Optionally register device for the new user
    if (deviceId && deviceInfo) {
      try {
        await this.userDevicesService.registerDevice(user.id, deviceId, deviceInfo);
      } catch (error) {
        this.logger.error(`Failed to register device: ${error.message}`);
      }
    }
    
    // Generate tokens
    const tokens = await this.getTokens(user.id);
    
    // Use try-catch to gracefully handle any errors with referral code
    if (registerDto.referralCode) {
      try {
        // Fix: Change validateReferralCode to a method that exists on ReferralService
        const referralResult = await this.referralService.getReferralByCode(registerDto.referralCode);
        if (!referralResult) {
          throw new BadRequestException('Invalid referral code');
        }
      } catch (error) {
        // Log the error but don't expose internal details
        this.logger.error(`Error validating referral code: ${error.message}`);
        throw new BadRequestException('Invalid referral code');
      }
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async walletLogin(walletLoginDto: WalletLoginDto, req: Request) {
    try {
      const { address, signature, message } = walletLoginDto;
      this.logger.log(`Wallet login attempt for address: ${address}`);
  
      // Always normalize the wallet address to lowercase
      const normalizedAddress = address.toLowerCase();
      
      // Get device information
      const userAgent = req.headers['user-agent'];
      const ipAddress = this.getIpAddress(req);
      const deviceId = this.deviceDetectorService.generateDeviceId(userAgent, ipAddress);
  
      // Check if we should bypass device verification
      const isDevelopmentMode = this.configService.get<string>('NODE_ENV') === 'development';
      const isTestMode = this.configService.get<string>('NODE_ENV') === 'test';
      const skipDeviceCheck = isDevelopmentMode || isTestMode || 
                            this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true';
  
      // First check if user already exists by wallet address stored directly on user
      let user = await this.usersService.findByWalletAddress(normalizedAddress);
      
      // If no user found, check for a wallet record
      if (!user) {
        const wallet = await this.walletRepository.findOne({
          where: { address: normalizedAddress },
          relations: ['user']
        });
        
        if (wallet?.user) {
          user = wallet.user;
          this.logger.log(`Found existing wallet for user ID: ${user.id}`);
        }
      } else {
        this.logger.log(`Found user with wallet address: ${user.id}`);
      }
  
      let wallet = null;
      let isNewUser = false;
  
      if (user) {
        // If user exists and an email is provided, we can update the email if it's not set
        if (walletLoginDto.email && !user.email) {
          user.email = walletLoginDto.email;
          await this.userRepository.save(user);
          this.logger.log(`Updated email for existing user: ${user.id}`);
        }
  
        // Check if this user already has a wallet - use userId consistently 
        wallet = await this.walletRepository.findOne({
          where: { 
            userId: user.id,
            address: normalizedAddress
          }
        });
        
        if (!wallet) {
          // Create a wallet record if it doesn't exist - use userId consistently
          this.logger.log(`Creating wallet record for existing user: ${user.id}`);
          wallet = this.walletRepository.create({
            address: normalizedAddress,
            userId: user.id,
            chain: 'ETH',
            isActive: true,
          });
          
          await this.walletRepository.save(wallet);
        }
  
        // Check if this device is already bound to another user account
        if (!skipDeviceCheck) {
          // First, validate the device-wallet pairing
          const isValidPairing = await this.userDevicesService.validateDeviceWalletPairing(
            deviceId, 
            normalizedAddress, 
            user.id
          );
          
          if (!isValidPairing) {
            throw new ForbiddenException('This device has already been registered with another wallet address');
          }
        }
      } else {
        // Create a new user with wallet - NO EMAIL REQUIRED
        this.logger.log(`Creating new user and wallet for address: ${normalizedAddress}`);
        isNewUser = true;
        
        // Check device constraints if not skipped
        if (!skipDeviceCheck) {
          // Validate the device-wallet pairing
          const isValidPairing = await this.userDevicesService.validateDeviceWalletPairing(
            deviceId, 
            normalizedAddress
          );
          
          if (!isValidPairing) {
            throw new ForbiddenException('This device has already been registered with another wallet address');
          }
        }
  
        // Generate a random password for the new wallet user
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        // Create user with the wallet address stored directly
        // Email is entirely optional now
        user = this.userRepository.create({
          email: walletLoginDto.email || null,  // Email can be null
          password: hashedPassword,
          isVerified: true, // Wallet users are automatically verified
          role: UserRole.USER,
          walletAddress: normalizedAddress, // Store wallet address directly
        });
  
        await this.userRepository.save(user).catch(error => {
          this.logger.error(`Error creating user: ${error.message}`);
          throw new InternalServerErrorException('Failed to create user account');
        });
  
        // Create wallet record linked to the user - use userId consistently
        wallet = this.walletRepository.create({
          address: normalizedAddress,
          userId: user.id,
          chain: 'ETH',
          isActive: true,
        });
  
        await this.walletRepository.save(wallet).catch(error => {
          this.logger.error(`Error creating wallet: ${error.message}`);
          throw new InternalServerErrorException('Failed to create wallet record');
        });
  
        // Mint 1 SHAHI token for new users (with retry)
        this.mintTokensForNewUser(normalizedAddress);
      }
  
      // Update or create device record
      try {
        const deviceInfo = this.deviceDetectorService.detect(userAgent);
        await this.userDevicesService.registerDevice(user.id, deviceId, {
          ...deviceInfo,
          userAgent: userAgent || 'unknown',
          lastIpAddress: ipAddress,
        });
      } catch (error) {
        // Log device error but continue login flow
        // Only if this is not a ForbiddenException - in that case, we want to stop
        if (error instanceof ForbiddenException) {
          throw error;
        }
        this.logger.error(`Non-critical error managing device data: ${error.message}`);
      }
  
      // Create session for wallet login
      try {
        const tokens = await this.getTokens(user.id);
        
        await this.userSessionsService.create({
          userId: user.id,
          deviceId,
          token: tokens.refreshToken,
          ipAddress,
          userAgent: userAgent || 'unknown',
          expiresAt: new Date(Date.now() + this.getRefreshTokenExpiresInMs()),
        }).catch(error => {
          this.logger.error(`Error creating session: ${error.message}`);
          // Continue even if session creation fails
        });
        
        return {
          ...this.generateToken(user),
          wallet: normalizedAddress,
          isNewUser,
        };
      } catch (error) {
        this.logger.error(`Authentication error: ${error.message}`);
        throw new InternalServerErrorException('Authentication failed');
      }
    } catch (error) {
      // Ensure all errors are properly logged and classified
      if (error instanceof UnauthorizedException ||
          error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error; // Re-throw application-level exceptions
      }
      
      // Log unexpected errors and throw a generic message
      this.logger.error(`Wallet login error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Wallet authentication failed');
    }
  }
  
  async verifyWalletSignature(message: string, signature: string): Promise<string> {
    try {
      // More robust error handling for verification
      if (!message || !signature) {
        throw new BadRequestException('Message and signature are required');
      }
      
      // Use try-catch to handle verification failures
      try {
        return verifyMessage(message, signature);
      } catch (error) {
        this.logger.error(`Signature verification error: ${error.message}`);
        throw new UnauthorizedException('Invalid signature format');
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    // Generate password reset token
    const resetToken = await this.generatePasswordResetToken(user.id);

    // Store token in user record
    await this.usersService.setResetPasswordToken(email, resetToken);

    // Send password reset email
    await this.mailService.sendPasswordReset(
      user.email,
      `${user.firstName} ${user.lastName}`.trim() || 'user',
      resetToken,
    );

    return { message: 'If your email is registered, you will receive a password reset link.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_RESET_SECRET', this.configService.get('JWT_SECRET')),
      });

      const user = await this.userRepository.findOne({
        where: {
          id: decoded.userId,
          resetPasswordToken: token,
          resetPasswordExpires: MoreThan(new Date()),
        },
      });

      if (!user) {
        throw new NotFoundException('Invalid or expired token');
      }

      // Update password
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.userRepository.save(user);

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Verify user's email address using verification token
   * @param token Email verification token
   * @returns Success message or throws an error
   */
  async verifyEmail(token: string) {
    try {
      // Validate token
      let decoded: any;
      try {
        decoded = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_EMAIL_SECRET', this.configService.get('JWT_SECRET')),
        });
      } catch (error) {
        this.logger.error(`Invalid verification token: ${error.message}`);
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Find user by ID from token
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId || decoded.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isVerified) {
        return { success: true, message: 'Email already verified' };
      }

      // Update email verification status
      await this.usersService.verifyEmail(user.id);
      
      // Send welcome email after verification
      try {
        // Use sendEmailVerification instead of sendEmailConfirmation, as it exists in the MailService
        await this.mailService.sendWelcome(
          user.email, 
          user.firstName || 'User'
        );
      } catch (error) {
        // Log error but don't fail the verification process
        this.logger.error(`Failed to send welcome email: ${error.message}`);
      }

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async refreshToken(refreshToken: string) {
    // Verify the refresh token exists and is valid
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate a new access token
    const payload = {
      sub: tokenEntity.user.id,
      email: tokenEntity.user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    // Optional: rotate refresh token for better security
    // await this.refreshTokenRepository.delete({ id: tokenEntity.id });
    // const newRefreshToken = await this.generateRefreshToken(tokenEntity.user);
    // return { accessToken, refreshToken: newRefreshToken };

    // Or simply return the new access token
    return { accessToken };
  }

  private async generateToken(user: any) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin || user.role === UserRole.ADMIN,
    };

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
        expiresIn: '30d',
      },
    );

    // Store refresh token in database
    await this.usersService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin || user.role === UserRole.ADMIN,
      },
    };
  }

  private async checkForFraudSignals(registerDto: RegisterDto, req: Request) {
    // Check for common disposable email domains
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com'];
    const emailDomain = registerDto.email.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
      throw new BadRequestException('Disposable email addresses are not allowed');
    }

    // Check for multiple registrations from same IP
    const ipAddress = this.getIpAddress(req);
    const hourAgo = new Date(Date.now() - 3600000);

    const registrationsFromSameIP = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.devices', 'device')
      .where('device.lastIpAddress = :ipAddress', { ipAddress })
      .andWhere('user.createdAt >= :hourAgo', { hourAgo })
      .getCount();
    if (registrationsFromSameIP >= 5) {
      // Max 5 registrations per hour from same IP
      throw new BadRequestException('Too many registrations from this IP address');
    }

    return true;
  }

  private async generateEmailVerificationToken(userId: string): Promise<string> {
    const payload = { userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_EMAIL_SECRET', this.configService.get('JWT_SECRET')),
      expiresIn: '24h',
    });
  }

  private async generatePasswordResetToken(userId: string): Promise<string> {
    const payload = { userId };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_RESET_SECRET', this.configService.get('JWT_SECRET')),
      expiresIn: '1h',
    });
  }

  private async getTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private getRefreshTokenExpiresInMs(): number {
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    const match = refreshExpiration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default to 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  private getIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      'unknown'
    ).split(',')[0];
  }

  /**
   * Resends the verification email to the user
   * @param email The user's email address
   * @returns A success message or throws an error
   */
  async resendVerification(email: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    
    if (user.isVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }
    
    // Generate a new verification token
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'email-verification' },
      { expiresIn: '24h' },
    );
    
    // Send the verification email
    await this.mailService.sendEmailVerification(
      user.email,
      user.firstName || 'User',
      token
    );
    
    return {
      success: true,
      message: 'Verification email sent',
    };
  }

  /**
   * Generate JWT tokens for the user
   * @param user User object
   * @returns Access and refresh tokens
   */
  private async generateTokens(user: any): Promise<{ accessToken: string, refreshToken: string }> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        payload,
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRATION', '1h'),
        }
      ),
      this.jwtService.signAsync(
        { sub: user.id }, // Simplified payload for refresh token
        {
          secret: this.configService.get('JWT_REFRESH_SECRET', this.configService.get('JWT_SECRET')),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        }
      )
    ]);
    
    return {
      accessToken,
      refreshToken
    };
  }

  async findUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    this.logger.log(`Finding user by wallet address: ${walletAddress}`);
    try {
      // Try to find a user with this wallet address
      const user = await this.usersService.findByWalletAddress(walletAddress);
      if (user) {
        this.logger.log(`User found for wallet address: ${walletAddress}`);
      } else {
        this.logger.log(`No user found for wallet address: ${walletAddress}`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by wallet address: ${error.message}`, error.stack);
      throw error;
    }
  }

  generateWalletChallenge(address: string): string {
    this.logger.log(`Generating wallet challenge for address: ${address}`);
    // Generate a random challenge or nonce for the wallet to sign
    const timestamp = Date.now();
    const challenge = `Sign this message to authenticate with AliveHuman: ${timestamp}`;
    return challenge;
  }

  /**
   * Handle the initial wallet connection request and generate a challenge
   * @param walletAddress The wallet address trying to connect
   * @returns Challenge message to be signed by the wallet
   */
  async handleWalletConnect(walletAddress: string): Promise<{ exists: boolean; challenge: string }> {
    this.logger.log(`Handling wallet connection for address: ${walletAddress}`);
    
    try {
      // Check if user already exists with this wallet
      const existingUser = await this.findUserByWalletAddress(walletAddress);
      
      // Generate a challenge message for the wallet to sign
      const challenge = this.generateWalletChallenge(walletAddress);
      this.logger.log(`Generated challenge: ${challenge.substring(0, 20)}...`);
      
      // Return the challenge and whether the user exists
      return {
        exists: !!existingUser,
        challenge: challenge
      };
    } catch (error) {
      this.logger.error(`Error handling wallet connect: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process wallet connection');
    }
  }

  /**
   * Authenticate a wallet using a signed challenge
   * @param walletLoginDto Contains the wallet address, message, and signature
   * @param req Request object for getting device info
   */
  async authenticateWallet(walletLoginDto: WalletLoginDto, req: Request) {
    const { address, signature, message } = walletLoginDto;
    this.logger.log(`Wallet authentication attempt for address: ${address}`);
    this.logger.log(`Received message: ${message?.substring(0, 30)}...`);
    this.logger.log(`Received signature: ${signature?.substring(0, 20)}...`);
    
    if (!message || !signature) {
      this.logger.error('Missing message or signature in authentication request');
      throw new BadRequestException('Message and signature are required');
    }
    
    try {
      // Verify the signature
      let recoveredAddress: string;
      try {
        this.logger.log(`Verifying signature for message: ${message.substring(0, 30)}...`);
        recoveredAddress = verifyMessage(message, signature);
        this.logger.log(`Signature verified, recovered address: ${recoveredAddress}`);
      } catch (error) {
        this.logger.error(`Signature verification failed: ${error.message}`);
        this.logger.error(`Message used for verification: ${message}`);
        this.logger.error(`Signature used for verification: ${signature}`);
        throw new UnauthorizedException('Invalid signature');
      }
      
      // Check if the recovered address matches the provided address (case-insensitive)
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        this.logger.warn(`Address mismatch: ${recoveredAddress.toLowerCase()} vs ${address.toLowerCase()}`);
        throw new UnauthorizedException('Invalid signature: address mismatch');
      }
      
      // Now proceed with login or registration as needed
      return await this.walletLogin(walletLoginDto, req);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Wallet authentication error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Wallet authentication failed');
    }
  }

  // Helper method to mint tokens with retry logic
  private async mintTokensForNewUser(walletAddress: string): Promise<void> {
    let mintSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;
  
    while (!mintSuccess && retryCount < maxRetries) {
      try {
        this.logger.log(`Attempt ${retryCount + 1} to mint 1 SHAHI for new user: ${walletAddress}`);
        const txHash = await this.shahiTokenService.mintForNewUser(walletAddress);
        if (txHash) {
          this.logger.log(`Successfully minted 1 SHAHI for new user ${walletAddress}, tx: ${txHash}`);
          mintSuccess = true;
        } else {
          this.logger.warn(`Failed to mint SHAHI for new user ${walletAddress}`);
          retryCount++;
          if (retryCount < maxRetries) await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between retries
        }
      } catch (error) {
        this.logger.error(`Error minting SHAHI tokens (attempt ${retryCount + 1}): ${error.message}`);
        retryCount++;
        if (retryCount < maxRetries) await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between retries
      }
    }
  
    if (!mintSuccess) {
      this.logger.warn(`Failed to mint SHAHI tokens after ${maxRetries} attempts. Adding to retry queue.`);
      // this.mintingQueueService.addToQueue(walletAddress);
    }
  }
}
