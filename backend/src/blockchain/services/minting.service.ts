import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { ShahiTokenService } from './shahi-token.service';
import { MerkleService } from './merkle.service';
import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

@Injectable()
export class MintingService {
  private readonly logger = new Logger(MintingService.name);

  constructor(
    private readonly deviceDetector: DeviceDetectorService,
    private readonly shahiToken: ShahiTokenService,
    private readonly merkleService: MerkleService,
  ) {}

  async processFirstTimeMint(userAddress: string, userAgent: string, ip: string, deviceId?: string): Promise<string> {
    // Use provided deviceId or generate one if not provided
    const finalDeviceId = deviceId || await this.deviceDetector.generateDeviceId(userAgent, ip);
    
    this.logger.log(`Processing first-time mint for ${userAddress} from device ${finalDeviceId.substring(0, 8)}...`);
    
    const merkleProof = this.merkleService.getProof(userAddress);
    
    // Verify proof before proceeding
    if (!this.merkleService.verifyProof(userAddress, merkleProof)) {
      throw new UnauthorizedException('User is not eligible for minting');
    }
    
    // Log the minting attempt
    this.logger.log(`Attempting first-time mint for ${userAddress} with device ${finalDeviceId.substring(0, 8)}...`);
    
    return this.shahiToken.firstTimeMint(userAddress, finalDeviceId, merkleProof);
  }

  async processAnnualMint(userAddress: string, userAgent: string, ip: string, deviceId?: string): Promise<string> {
    // Use provided deviceId or generate one if not provided
    const finalDeviceId = deviceId || await this.deviceDetector.generateDeviceId(userAgent, ip);
    
    this.logger.log(`Processing annual mint for ${userAddress} from device ${finalDeviceId.substring(0, 8)}...`);
    
    // Log the minting attempt
    this.logger.log(`Attempting annual mint for ${userAddress} with device ${finalDeviceId.substring(0, 8)}...`);
    
    return this.shahiToken.annualMint(userAddress, finalDeviceId);
  }
}
