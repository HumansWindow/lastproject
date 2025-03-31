import { Controller, Post, UseGuards, Req, Headers, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MintingService } from '../services/minting.service';
import { RealIP } from 'nestjs-real-ip';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MintRateLimitGuard } from '../guards/rate-limit.guard';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { UserDevicesService } from '../../users/services/user-devices.service';
import { ShahiTokenService } from '../services/shahi-token.service';

@ApiTags('minting')
@Controller('minting')
@UseGuards(AuthGuard('jwt'))
export class MintingController {
  private readonly logger = new Logger(MintingController.name);

  constructor(
    private readonly mintingService: MintingService,
    private readonly deviceDetectorService: DeviceDetectorService,
    private readonly userDevicesService: UserDevicesService,
    private readonly shahiTokenService: ShahiTokenService
  ) {}

  @Post('first-time')
  @UseGuards(MintRateLimitGuard)
  @ApiOperation({ summary: 'First-time SHAHI token minting' })
  @ApiResponse({ status: 201, description: 'Returns transaction hash' })
  async firstTimeMint(
    @Req() req: any,
    @Headers('user-agent') userAgent: string,
    @RealIP() ip: string,
  ) {
    const walletAddress = req.user.walletAddress;
    
    // Get device ID from request
    const deviceId = req.headers['x-device-id'] as string || 
                    req.cookies?.deviceId ||
                    this.deviceDetectorService.generateDeviceId(
                      userAgent,
                      ip
                    );
    
    this.logger.log(`First-time mint request received from wallet ${walletAddress} on device ${deviceId.substring(0, 8)}...`);
    
    // Check if this device is allowed to mint with this wallet
    if (!this.shahiTokenService.isInitialized()) {
      throw new BadRequestException('Blockchain service is not fully initialized, please try again later');
    }
    
    // Validate device-wallet pairing
    const isValidDeviceWalletPair = await this.userDevicesService.validateDeviceWalletPairing(
      deviceId,
      walletAddress
    );
    
    if (!isValidDeviceWalletPair) {
      this.logger.warn(`Blocked minting attempt: Device ${deviceId.substring(0, 8)}... not paired with wallet ${walletAddress}`);
      throw new ForbiddenException(
        'This device is not paired with the provided wallet address. For security reasons, you can only mint tokens from the device used for authentication.'
      );
    }
    
    // Check if the token should be minted (not already in progress)
    const shouldMint = await this.shahiTokenService.shouldMintToken(walletAddress, deviceId);
    if (!shouldMint) {
      this.logger.warn(`Minting operation already in progress for address ${walletAddress}`);
      throw new BadRequestException('A minting operation is already in progress for this wallet');
    }
    
    const txHash = await this.mintingService.processFirstTimeMint(
      walletAddress,
      userAgent,
      ip,
      deviceId // Pass the deviceId to the minting service
    );
    
    return { txHash };
  }

  @Post('annual')
  @UseGuards(MintRateLimitGuard)
  @ApiOperation({ summary: 'Annual SHAHI token minting' })
  @ApiResponse({ status: 201, description: 'Returns transaction hash' })
  async annualMint(
    @Req() req: any,
    @Headers('user-agent') userAgent: string,
    @RealIP() ip: string,
  ) {
    const walletAddress = req.user.walletAddress;
    
    // Get device ID from request
    const deviceId = req.headers['x-device-id'] as string || 
                    req.cookies?.deviceId ||
                    this.deviceDetectorService.generateDeviceId(
                      userAgent,
                      ip
                    );
    
    this.logger.log(`Annual mint request received from wallet ${walletAddress} on device ${deviceId.substring(0, 8)}...`);
    
    // Check if this device is allowed to mint with this wallet
    if (!this.shahiTokenService.isInitialized()) {
      throw new BadRequestException('Blockchain service is not fully initialized, please try again later');
    }
    
    // Validate device-wallet pairing
    const isValidDeviceWalletPair = await this.userDevicesService.validateDeviceWalletPairing(
      deviceId,
      walletAddress
    );
    
    if (!isValidDeviceWalletPair) {
      this.logger.warn(`Blocked minting attempt: Device ${deviceId.substring(0, 8)}... not paired with wallet ${walletAddress}`);
      throw new ForbiddenException(
        'This device is not paired with the provided wallet address. For security reasons, you can only mint tokens from the device used for authentication.'
      );
    }
    
    // Check if the token should be minted (not already in progress)
    const shouldMint = await this.shahiTokenService.shouldMintToken(walletAddress, deviceId);
    if (!shouldMint) {
      this.logger.warn(`Minting operation already in progress for address ${walletAddress}`);
      throw new BadRequestException('A minting operation is already in progress for this wallet');
    }
    
    const txHash = await this.mintingService.processAnnualMint(
      walletAddress,
      userAgent,
      ip,
      deviceId // Pass the deviceId to the minting service
    );
    
    return { txHash };
  }
}
