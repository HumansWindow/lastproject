import { Controller, Post, Body, Req, Logger, BadRequestException, UnauthorizedException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';
import { WalletConnectResponseDto } from '../dto/wallet-connect-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';
import { UserDevicesService } from '../../users/services/user-devices.service';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import * as crypto from 'crypto';

// Challenge cache to prevent duplicate wallet connection requests
interface ChallengeRecord {
  challenge: string;
  timestamp: number;
  expiresAt: number;
}

// Recovery challenge record
interface RecoveryRecord {
  token: string;
  address: string;
  timestamp: number;
  expiresAt: number;
}

@ApiTags('wallet-auth')
@Controller('auth/wallet')
export class WalletAuthController {
  private readonly logger = new Logger(WalletAuthController.name);
  private challengeCache: Map<string, ChallengeRecord> = new Map();
  private recoveryCache: Map<string, RecoveryRecord> = new Map();
  private readonly CHALLENGE_EXPIRATION = 3600000; // 1 hour in milliseconds
  private readonly RECOVERY_EXPIRATION = 900000; // 15 minutes in milliseconds

  constructor(
    private readonly authService: AuthService,
    private readonly userDevicesService: UserDevicesService,
    @Inject(forwardRef(() => DeviceDetectorService))
    private readonly deviceDetectorService: DeviceDetectorService
  ) {}

  @Post('connect')
  @ApiOperation({ summary: 'Initiate wallet connection and get challenge' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a challenge to be signed by the wallet',
    type: WalletConnectResponseDto 
  })    
  async connect(@Body() body: { address: string }, @Req() req: Request): Promise<WalletConnectResponseDto> {
    if (!body.address) {
      throw new BadRequestException('Wallet address is required');
    }
    
    // Normalize the address to lowercase
    const normalizedAddress = body.address.toLowerCase();
    
    this.logger.log(`Wallet connection request received for address: ${normalizedAddress}`);
    
    // Check if we already have a valid challenge for this address
    const existingChallenge = this.challengeCache.get(normalizedAddress);
    if (existingChallenge && existingChallenge.expiresAt > Date.now()) {
      this.logger.log(`Using cached challenge for ${normalizedAddress}`);
      return {
        address: normalizedAddress,
        challenge: existingChallenge.challenge,
        timestamp: existingChallenge.timestamp,
        isExistingUser: false // This will be properly set by handleWalletConnect
      };
    }
    
    // Clean up expired challenges occasionally to prevent memory leaks
    this.cleanupExpiredChallenges();
    
    // Get device ID from request
    const deviceId = req.headers['x-device-id'] as string || 
                    req.cookies?.deviceId ||
                    this.deviceDetectorService.generateDeviceId(
                      req.headers['user-agent'] as string,
                      req.ip
                    );

    // Check if this device is already registered
    const isDeviceRegistered = await this.userDevicesService.isDeviceRegistered(deviceId);
    
    if (isDeviceRegistered) {
      this.logger.log(`Device ${deviceId.substring(0, 8)}... is already registered - checking wallet pairing`);
      
      // If device is registered, check if it's registered with this wallet address
      const isDeviceWalletPaired = await this.userDevicesService.validateDeviceWalletPairing(
        deviceId, 
        normalizedAddress
      );
      
      if (!isDeviceWalletPaired) {
        this.logger.warn(`Device ${deviceId.substring(0, 8)}... already registered with a different wallet - preventing second registration`);
        throw new ForbiddenException(
          'This device is already associated with a different wallet. For security reasons, each device can only be used with one wallet.'
        );
      }
    }
    
    try {
      // Generate a challenge for the wallet to sign
      const response = await this.authService.handleWalletConnect(normalizedAddress);
      this.logger.log(`Generated challenge for ${normalizedAddress}: ${response.challenge.substring(0, 20)}...`);
      
      // Store challenge in cache
      this.challengeCache.set(normalizedAddress, {
        challenge: response.challenge,
        timestamp: response.timestamp,
        expiresAt: Date.now() + this.CHALLENGE_EXPIRATION
      });
      
      return response;
    } catch (error) {
      this.logger.error(`Error in wallet connect: ${error.message}`);
      throw new BadRequestException('Failed to generate challenge for wallet');
    }
  }

  /**
   * Generate a recovery challenge when the normal signing process fails
   * This allows clients to authenticate even when wallet signing fails
   */
  @Post('recovery-challenge')
  @ApiOperation({ summary: 'Generate recovery challenge when wallet signing fails' })
  @ApiResponse({ status: 200, description: 'Recovery challenge generated' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async recoveryChallenge(
    @Body() body: { address: string; failedMessage?: string },
    @Req() req: Request
  ) {
    if (!body.address) {
      throw new BadRequestException('Wallet address is required');
    }
    
    // Normalize the address to lowercase
    const normalizedAddress = body.address.toLowerCase();
    
    this.logger.log(`Recovery challenge requested for address: ${normalizedAddress}`);
    
    // Generate a recovery token valid for a limited time
    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store recovery token in cache
    this.recoveryCache.set(recoveryToken, {
      token: recoveryToken,
      address: normalizedAddress,
      timestamp,
      expiresAt: timestamp + this.RECOVERY_EXPIRATION
    });
    
    // Log what failed message was provided, if any
    if (body.failedMessage) {
      this.logger.log(`Failed message was provided for recovery: ${body.failedMessage.substring(0, 50)}...`);
    }
    
    // Clean up expired recovery tokens periodically
    this.cleanupExpiredRecoveryTokens();
    
    return {
      address: normalizedAddress,
      recoveryToken,
      expiresIn: this.RECOVERY_EXPIRATION / 1000, // in seconds
      timestamp
    };
  }

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async authenticate(@Body() walletLoginDto: WalletLoginDto, @Req() req: Request) {
    // Normalize wallet address
    const normalizedAddress = walletLoginDto.walletAddress?.toLowerCase();
    
    // Add request tracking ID for correlation across logs
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Log the entire request for detailed debugging
    this.logger.log(`[${requestId}] Authentication request received from IP: ${req.ip} for address: ${normalizedAddress}`);
    
    // Check if this is a recovery signature
    if (walletLoginDto.signature && walletLoginDto.signature.startsWith('recovery_')) {
      this.logger.log(`[${requestId}] Recovery signature detected, processing alternative authentication flow`);
      return this.processRecoveryAuthentication(walletLoginDto, req, requestId);
    }
    
    // Log the authentication request details
    this.logger.log(`[${requestId}] Authentication request details:`, {
      address: normalizedAddress,
      messageExists: !!walletLoginDto.message,
      messageLength: walletLoginDto.message?.length || 0,
      messagePreview: walletLoginDto.message?.substring(0, 20) || '',
      signatureExists: !!walletLoginDto.signature,
      signatureLength: walletLoginDto.signature?.length || 0,
      signaturePreview: walletLoginDto.signature?.substring(0, 20) || '',
      emailExists: !!walletLoginDto.email
    });
    
    try {
      // 1. Validate required fields
      if (!normalizedAddress) {
        throw new BadRequestException('Wallet address is required');
      }
      
      if (!walletLoginDto.message) {
        throw new BadRequestException('Message/challenge is required');
      }
      
      if (!walletLoginDto.signature) {
        throw new BadRequestException('Signature is required');
      }
      
      // 2. Verify the signature independently for extra logging
      try {
        const recoveredAddress = verifyMessage(walletLoginDto.message, walletLoginDto.signature);
        const recoveredNormalized = recoveredAddress.toLowerCase();
        this.logger.log(`[${requestId}] Signature pre-verification successful, recovered: ${recoveredNormalized}`);
        
        if (recoveredNormalized !== normalizedAddress) {
          this.logger.warn(`[${requestId}] Address mismatch: ${recoveredNormalized} vs ${normalizedAddress}`);
        }
      } catch (verifyError) {
        this.logger.error(`[${requestId}] Pre-verification signature check failed: ${verifyError.message}`);
        throw new UnauthorizedException(`Invalid signature format: ${verifyError.message}`);
      }
      
      // 3. Check if the device is already registered
      // Get device ID from the request
      const deviceId = req.headers['x-device-id'] as string || 
                      req.cookies?.deviceId ||
                      this.deviceDetectorService.generateDeviceId(
                        req.headers['user-agent'] as string,
                        req.ip
                      );
      
      // Check if device is already associated with another wallet
      if (deviceId) {
        const isDeviceWalletPaired = await this.userDevicesService.validateDeviceWalletPairing(
          deviceId,
          normalizedAddress
        );
        
        if (!isDeviceWalletPaired) {
          this.logger.warn(`Device ${deviceId.substring(0, 8)}... already registered with a different wallet - preventing second registration`);
          throw new ForbiddenException(
            'This device is already associated with a different wallet. For security reasons, each device can only be used with one wallet.'
          );
        }
      }
      
      // 4. Proceed with authentication through the auth service
      this.logger.log(`[${requestId}] Proceeding with wallet authentication for address: ${normalizedAddress}`);
      
      // Clean up expired challenges before authenticating
      this.cleanupExpiredChallenges();
      
      const authResult = await this.authService.authenticateWallet(
        walletLoginDto,
        req
      );
      
      this.logger.log(`[${requestId}] Authentication successful for wallet: ${normalizedAddress}`);
      return authResult;
      
    } catch (error) {
      this.logger.error(`[${requestId}] Wallet authentication failed: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Process authentication with recovery token instead of wallet signature
   */
  private async processRecoveryAuthentication(
    walletLoginDto: WalletLoginDto,
    req: Request,
    requestId: string
  ) {
    const normalizedAddress = walletLoginDto.walletAddress?.toLowerCase();
    this.logger.log(`[${requestId}] Processing recovery authentication for ${normalizedAddress}`);
    
    try {
      // Extract recovery token from signature
      let recoveryToken;
      
      if (walletLoginDto.signature.startsWith('recovery_token:')) {
        // Extract token format: recovery_token:TOKEN
        recoveryToken = walletLoginDto.signature.substring('recovery_token:'.length);
      } else if (walletLoginDto.signature.startsWith('recovery_signature_')) {
        // Extract format: recovery_signature_TIMESTAMP_ADDRESS
        // This is a dev-mode recovery that works with BYPASS_WALLET_SIGNATURE=true
        const parts = walletLoginDto.signature.split('_');
        if (parts.length >= 3 && normalizedAddress === parts[3]?.toLowerCase()) {
          this.logger.log(`[${requestId}] Development mode recovery signature detected`);
          
          // If BYPASS_WALLET_SIGNATURE is true, this will work via the auth service
          return await this.authService.authenticateWallet(walletLoginDto, req);
        } else {
          throw new UnauthorizedException('Invalid recovery signature format');
        }
      } else {
        throw new UnauthorizedException('Invalid recovery signature format');
      }
      
      // Validate recovery token
      const recoveryRecord = this.recoveryCache.get(recoveryToken);
      
      if (!recoveryRecord) {
        this.logger.warn(`[${requestId}] Recovery token not found: ${recoveryToken.substring(0, 10)}...`);
        throw new UnauthorizedException('Invalid or expired recovery token');
      }
      
      if (recoveryRecord.expiresAt < Date.now()) {
        this.logger.warn(`[${requestId}] Recovery token expired: ${recoveryToken.substring(0, 10)}...`);
        this.recoveryCache.delete(recoveryToken);
        throw new UnauthorizedException('Recovery token expired');
      }
      
      if (recoveryRecord.address !== normalizedAddress) {
        this.logger.warn(`[${requestId}] Recovery token address mismatch: ${recoveryRecord.address} vs ${normalizedAddress}`);
        throw new UnauthorizedException('Recovery token not valid for this address');
      }
      
      // Token is valid - authenticate using special recovery method
      this.logger.log(`[${requestId}] Valid recovery token for ${normalizedAddress}, proceeding with authentication`);
      
      // Use the recovery token as the signature for authentication
      // The auth service must be modified to accept this special format
      walletLoginDto.signature = `valid_recovery:${recoveryToken}`;
      
      // Invalidate the token after use
      this.recoveryCache.delete(recoveryToken);
      
      return await this.authService.authenticateWallet(walletLoginDto, req);
    } catch (error) {
      this.logger.error(`[${requestId}] Recovery authentication failed: ${error.message}`);
      
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new UnauthorizedException(`Recovery authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Clean up expired challenges from the cache
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [address, record] of this.challengeCache.entries()) {
      if (record.expiresAt < now) {
        this.challengeCache.delete(address);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired challenges from cache`);
    }
  }
  
  /**
   * Clean up expired recovery tokens from the cache
   */
  private cleanupExpiredRecoveryTokens(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [token, record] of this.recoveryCache.entries()) {
      if (record.expiresAt < now) {
        this.recoveryCache.delete(token);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired recovery tokens from cache`);
    }
  }
}
