import { Controller, Post, Body, Req, Logger, BadRequestException, UnauthorizedException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';
import { WalletConnectResponseDto } from '../dto/wallet-connect-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';
import { UserDevicesService } from '../../users/services/user-devices.service';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';

// Challenge cache to prevent duplicate wallet connection requests
interface ChallengeRecord {
  challenge: string;
  timestamp: number;
  expiresAt: number;
}

@ApiTags('wallet-auth')
@Controller('auth/wallet')
export class WalletAuthController {
  private readonly logger = new Logger(WalletAuthController.name);
  private challengeCache: Map<string, ChallengeRecord> = new Map();
  private readonly CHALLENGE_EXPIRATION = 3600000; // 1 hour in milliseconds

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

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async authenticate(@Body() walletLoginDto: WalletLoginDto, @Req() req: Request) {
    // Normalize wallet address
    const normalizedAddress = walletLoginDto.address?.toLowerCase();
    
    // Add request tracking ID for correlation across logs
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Log the entire request for detailed debugging
    this.logger.log(`[${requestId}] Authentication request received from IP: ${req.ip} for address: ${normalizedAddress}`);
    
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
      
      // Check if device is already registered
      const isDeviceRegistered = await this.userDevicesService.isDeviceRegistered(deviceId);
      
      if (isDeviceRegistered) {
        // If device is registered, check if it can be used with this wallet
        const isWalletAllowedOnDevice = await this.userDevicesService.validateDeviceWalletPairing(
          deviceId,
          normalizedAddress
        );
        
        if (!isWalletAllowedOnDevice) {
          this.logger.warn(`[${requestId}] Preventing second registration: Device ${deviceId.substring(0, 10)}... already registered with a different wallet`);
          throw new ForbiddenException(
            'This device is already associated with a different wallet. For security reasons, each device can only be used with one wallet.'
          );
        }
      }
      
      // 4. Now proceed with the actual authentication
      const result = await this.authService.authenticateWallet(
        { ...walletLoginDto, address: normalizedAddress },
        req
      );
      
      this.logger.log(`[${requestId}] Authentication successful for: ${normalizedAddress}`);
      
      // 5. Clear the challenge from cache after successful authentication
      this.challengeCache.delete(normalizedAddress);
      
      return result;
    } catch (error) {
      this.logger.error(`[${requestId}] Authentication error for ${normalizedAddress || 'unknown'}: ${error.message}`);
      
      // More detailed error information
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message || 'Invalid request data');
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message || 'Invalid signature');
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message || 'Access denied');
      }
      
      // Log detailed error for troubleshooting
      this.logger.error(`[${requestId}] Detailed error:`, error);
      throw error;
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
}
