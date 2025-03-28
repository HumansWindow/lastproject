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

  async processFirstTimeMint(userAddress: string, userAgent: string, ip: string): Promise<string> {
    const deviceId = await this.deviceDetector.generateDeviceId(userAgent, ip);
    const merkleProof = this.merkleService.getProof(userAddress);
    
    // Verify proof before proceeding
    if (!this.merkleService.verifyProof(userAddress, merkleProof)) {
      throw new UnauthorizedException('User is not eligible for minting');
    }
    
    return this.shahiToken.firstTimeMint(userAddress, deviceId, merkleProof);
  }

  async processAnnualMint(userAddress: string, userAgent: string, ip: string): Promise<string> {
    const deviceId = await this.deviceDetector.generateDeviceId(userAgent, ip);
    return this.shahiToken.annualMint(userAddress, deviceId);
  }
}
