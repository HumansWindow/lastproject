import { Controller, Post, Body, Req, Logger, BadRequestException, UnauthorizedException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';
import { WalletConnectResponseDto } from '../dto/wallet-connect-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';
import { UserDevicesService } from '../../users/services/user-devices.service';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';

@ApiTags('wallet-auth')
@Controller('auth/wallet')
export class WalletAuthController {
  private readonly logger = new Logger(WalletAuthController.name);

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
    
    this.logger.log(`Wallet connection request received for address: ${body.address}`);
    
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
        body.address.toLowerCase()
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
      const response = await this.authService.handleWalletConnect(body.address);
      this.logger.log(`Generated challenge for ${body.address}: ${response.challenge.substring(0, 20)}...`);
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
    // Log the entire request for detailed debugging
    this.logger.log(`Authentication request received from IP: ${req.ip}`);
    
    // Log the authentication request details
    this.logger.log(`Authentication request details:`, {
      address: walletLoginDto.address,
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
      if (!walletLoginDto.address) {
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
        this.logger.log(`Signature pre-verification successful, recovered: ${recoveredAddress}`);
        
        if (recoveredAddress.toLowerCase() !== walletLoginDto.address.toLowerCase()) {
          this.logger.warn(`Address mismatch: ${recoveredAddress.toLowerCase()} vs ${walletLoginDto.address.toLowerCase()}`);
        }
      } catch (verifyError) {
        this.logger.error(`Pre-verification signature check failed: ${verifyError.message}`);
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
                      
      const normalizedWalletAddress = walletLoginDto.address.toLowerCase();
      
      // Check if device is already registered
      const isDeviceRegistered = await this.userDevicesService.isDeviceRegistered(deviceId);
      
      if (isDeviceRegistered) {
        // If device is registered, check if it can be used with this wallet
        const isWalletAllowedOnDevice = await this.userDevicesService.validateDeviceWalletPairing(
          deviceId,
          normalizedWalletAddress
        );
        
        if (!isWalletAllowedOnDevice) {
          this.logger.warn(`Preventing second registration: Device ${deviceId.substring(0, 10)}... already registered with a different wallet`);
          throw new ForbiddenException(
            'This device is already associated with a different wallet. For security reasons, each device can only be used with one wallet.'
          );
        }
      }
      
      // 4. Now proceed with the actual authentication
      const result = await this.authService.authenticateWallet(walletLoginDto, req);
      this.logger.log(`Authentication successful for: ${walletLoginDto.address}`);
      return result;
    } catch (error) {
      this.logger.error(`Authentication error for ${walletLoginDto?.address || 'unknown'}: ${error.message}`);
      
      // More detailed error information
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message || 'Invalid request data');
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message || 'Invalid signature');
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message || 'Access denied');
      }
      
      // Log detailed error for troubleshooting
      this.logger.error(`Detailed error:`, error);
      throw error;
    }
  }
}
