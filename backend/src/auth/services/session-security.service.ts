import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import * as ipaddr from 'ipaddr.js';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { UserSession } from '../../users/entities/user-session.entity';
import { UserDevice } from '../../users/entities/user-device.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Security thresholds for session validation
 */
interface SecurityThresholds {
  // Minimum similarity score for user agents to be considered from same device (0.0 - 1.0)
  userAgentSimilarityThreshold: number;
  // Number of IP octets that must match (1-4, where 1 = same class A network, 4 = exact match)
  ipMatchLevel: number;
  // Whether to enforce strict IP validation
  enforceStrictIpValidation: boolean;
  // Whether to enable user agent validation
  enableUserAgentValidation: boolean;
  // Whether to check device fingerprints
  enableDeviceFingerprinting: boolean;
}

@Injectable()
export class SessionSecurityService {
  private readonly logger = new Logger(SessionSecurityService.name);
  private readonly securityThresholds: SecurityThresholds;
  
  constructor(
    private readonly deviceDetectorService: DeviceDetectorService,
    private readonly configService: ConfigService,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>
  ) {
    // Load security configuration from environment or use defaults
    this.securityThresholds = {
      userAgentSimilarityThreshold: 0.7,
      ipMatchLevel: this.configService.get('STRICT_IP_VALIDATION') === 'true' ? 3 : 2,
      enforceStrictIpValidation: this.configService.get('STRICT_IP_VALIDATION') === 'true',
      enableUserAgentValidation: this.configService.get('ENABLE_USER_AGENT_VALIDATION') !== 'false',
      enableDeviceFingerprinting: this.configService.get('SKIP_DEVICE_CHECK') !== 'true'
    };
    
    this.logger.log(`Session security initialized with thresholds: ${JSON.stringify(this.securityThresholds)}`);
  }

  /**
   * Validate that the current request matches the user's session and device
   * 
   * @param req The current request
   * @param userId The user ID from the authentication token
   * @param sessionId The session ID from the authentication token
   * @returns true if validation passes, throws UnauthorizedException otherwise
   */
  async validateRequestSession(
    req: Request,
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    if (!this.securityThresholds.enableDeviceFingerprinting) {
      this.logger.debug('Device fingerprinting disabled, skipping session validation');
      return true;
    }

    try {
      // Fetch the session from the database
      const session = await this.userSessionRepository.findOne({
        where: { id: sessionId, userId: userId, isActive: true },
        relations: ['device']
      });

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found or inactive for user ${userId}`);
        throw new UnauthorizedException('Invalid session');
      }

      // Check if session is expired
      if (session.expiresAt && new Date() > session.expiresAt) {
        this.logger.warn(`Session ${sessionId} expired for user ${userId}`);
        await this.endSession(sessionId);
        throw new UnauthorizedException('Session expired');
      }

      // Validate device fingerprint
      await this.validateDeviceFingerprint(req, session);

      // Validate user agent if enabled
      if (this.securityThresholds.enableUserAgentValidation) {
        this.validateUserAgent(req, session);
      }

      // Validate IP address
      this.validateIpAddress(req, session);

      // Update session with new activity
      await this.updateSessionActivity(session, req);

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`Session validation error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Session validation failed');
    }
  }

  /**
   * Validate that the device fingerprint matches
   */
  private async validateDeviceFingerprint(req: Request, session: UserSession): Promise<void> {
    if (!session.deviceId) {
      this.logger.warn(`No device ID associated with session ${session.id}`);
      throw new UnauthorizedException('Invalid device');
    }

    // Generate device ID from current request
    const currentDeviceId = this.deviceDetectorService.generateDeviceId(req);
    
    // Compare with stored device ID
    if (currentDeviceId !== session.deviceId) {
      this.logger.warn(
        `Device ID mismatch. Expected: ${session.deviceId.substring(0, 8)}..., ` +
        `Got: ${currentDeviceId.substring(0, 8)}...`
      );
      
      // Check if this device has been registered to the user before
      const knownDevice = await this.userDeviceRepository.findOne({
        where: { userId: session.userId, deviceId: currentDeviceId }
      });
      
      if (!knownDevice) {
        throw new UnauthorizedException('Device not recognized');
      }
    }
  }

  /**
   * Validate that the user agent is consistent with the session
   */
  private validateUserAgent(req: Request, session: UserSession): void {
    const currentUserAgent = req.headers['user-agent'] || '';
    const sessionUserAgent = session.userAgent || '';
    
    if (!currentUserAgent || !sessionUserAgent) {
      return; // Skip validation if user agent is missing
    }

    // Compare user agents
    const similarity = this.deviceDetectorService.compareUserAgents(
      currentUserAgent,
      sessionUserAgent
    );

    if (similarity < this.securityThresholds.userAgentSimilarityThreshold) {
      this.logger.warn(
        `User agent similarity below threshold (${similarity.toFixed(2)} < ${this.securityThresholds.userAgentSimilarityThreshold})`
      );
      throw new UnauthorizedException('Suspicious device change detected');
    }
  }

  /**
   * Validate that the IP address is consistent with the session
   */
  private validateIpAddress(req: Request, session: UserSession): void {
    const currentIp = this.getIpFromRequest(req);
    const sessionIp = session.ipAddress;
    
    if (!currentIp || !sessionIp) {
      return; // Skip validation if IP is missing
    }

    // Check IP similarity based on configured match level
    const ipMatchLevel = this.compareIpAddresses(currentIp, sessionIp);
    
    if (ipMatchLevel < this.securityThresholds.ipMatchLevel) {
      this.logger.warn(
        `IP address match level below threshold (${ipMatchLevel} < ${this.securityThresholds.ipMatchLevel}). ` +
        `Current: ${currentIp}, Session: ${sessionIp}`
      );
      
      if (this.securityThresholds.enforceStrictIpValidation) {
        throw new UnauthorizedException('Suspicious location change detected');
      } else {
        this.logger.warn('Allowing session despite IP mismatch (strict validation disabled)');
      }
    }
  }

  /**
   * Compare two IP addresses and return the number of matching octets (for IPv4)
   * or matching segments (for IPv6)
   * 
   * @returns Number between 0-4 for IPv4 or 0-8 for IPv6
   */
  private compareIpAddresses(ip1: string, ip2: string): number {
    try {
      // Parse IPs
      const addr1 = ipaddr.parse(ip1);
      const addr2 = ipaddr.parse(ip2);
      
      // If different versions, they don't match at all
      if (addr1.kind() !== addr2.kind()) {
        return 0;
      }
      
      // For IPv4
      if (addr1.kind() === 'ipv4') {
        const octets1 = addr1.toByteArray();
        const octets2 = addr2.toByteArray();
        
        let matchingOctets = 0;
        for (let i = 0; i < 4; i++) {
          if (octets1[i] === octets2[i]) {
            matchingOctets++;
          } else {
            break;
          }
        }
        
        return matchingOctets;
      }
      
      // For IPv6
      if (addr1.kind() === 'ipv6') {
        const parts1 = addr1.toByteArray();
        const parts2 = addr2.toByteArray();
        
        // For IPv6, we'll count matching 16-bit blocks (max 8)
        let matchingBlocks = 0;
        for (let i = 0; i < 16; i += 2) {
          if (parts1[i] === parts2[i] && parts1[i + 1] === parts2[i + 1]) {
            matchingBlocks++;
          } else {
            break;
          }
        }
        
        return matchingBlocks;
      }
      
      return 0;
    } catch (error) {
      this.logger.error(`Error comparing IP addresses: ${error.message}`);
      return 0;
    }
  }

  /**
   * Extract IP address from request
   */
  private getIpFromRequest(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      'unknown'
    ).split(',')[0];
  }

  /**
   * Update session with latest activity information
   */
  private async updateSessionActivity(session: UserSession, req: Request): Promise<void> {
    // We removed lastActiveAt field from UserSession entity, so no need to update it
    
    // Only update if the device ID exists
    if (session.deviceId) {
      // Find the device record
      const device = await this.userDeviceRepository.findOne({
        where: { deviceId: session.deviceId }
      });
      
      if (device) {
        // Update device information
        device.lastSeen = new Date();
        device.lastIpAddress = this.getIpFromRequest(req);
        device.visitCount += 1;
        
        await this.userDeviceRepository.save(device);
      }
    }
    
    await this.userSessionRepository.save(session);
  }

  /**
   * End a session
   */
  private async endSession(sessionId: string): Promise<void> {
    await this.userSessionRepository.update(
      { id: sessionId },
      { 
        isActive: false,
        endedAt: new Date()
      }
    );
  }
}