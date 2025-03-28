import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import DeviceDetector from 'device-detector-js';

@Injectable()
export class DeviceDetectorService {
  private readonly logger = new Logger(DeviceDetectorService.name);
  private readonly detector: DeviceDetector;

  constructor() {
    this.detector = new DeviceDetector();
  }

  /**
   * Generate a unique device ID based on user agent and IP address
   */
  generateDeviceId(req: Request | string, ipAddress?: string): string {
    try {
      let userAgent: string;
      let ip: string;

      if (typeof req === 'string') {
        // If req is a string, treat it as user agent
        userAgent = req;
        ip = ipAddress || 'unknown';
      } else {
        // If req is a Request object, extract user agent and IP
        userAgent = req.headers['user-agent'] || 'unknown';
        ip = ipAddress || this.getIpAddress(req) || 'unknown';
      }

      // Use a stable set of browser fingerprinting data
      const fingerprint = this.generateFingerprint(userAgent);
      
      // Generate a consistent hash from the fingerprint and first two segments of IP
      const ipSegments = ip.split('.').slice(0, 2).join('.');
      const data = `${fingerprint}-${ipSegments}`;
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      
      this.logger.log(`Generated device ID: ${hash.substring(0, 8)}... for user agent: ${userAgent.substring(0, 30)}...`);
      
      return hash;
    } catch (error) {
      this.logger.error(`Error generating device ID: ${error.message}`);
      // Generate a random ID as a fallback
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Detect device information from the user agent
   */
  detect(req: Request | string): any {
    try {
      const userAgent = typeof req === 'string' 
        ? req 
        : (req.headers['user-agent'] || 'unknown');
      
      const result = this.detector.parse(userAgent);
      
      return {
        deviceType: this.getDeviceType(result),
        deviceName: this.getDeviceName(result),
        platform: result.device?.brand || 'unknown',
        os: result.os?.name || 'unknown',
        osVersion: result.os?.version || 'unknown',
        browser: result.client?.name || 'unknown',
        browserVersion: result.client?.version || 'unknown',
      };
    } catch (error) {
      this.logger.error(`Error detecting device info: ${error.message}`);
      return {
        deviceType: 'unknown',
        deviceName: 'unknown',
        platform: 'unknown',
        os: 'unknown',
        osVersion: 'unknown',
        browser: 'unknown',
        browserVersion: 'unknown',
      };
    }
  }

  /**
   * Generate a stable browser fingerprint from user agent
   */
  private generateFingerprint(userAgent: string): string {
    const result = this.detector.parse(userAgent);
    
    // Create a stable set of fingerprinting data
    const fingerprintData = {
      browserName: result.client?.name || 'unknown',
      browserVersion: result.client?.version || 'unknown',
      osName: result.os?.name || 'unknown',
      osVersion: result.os?.version || 'unknown',
      deviceType: result.device?.type || 'unknown',
      deviceBrand: result.device?.brand || 'unknown',
      deviceModel: result.device?.model || 'unknown',
    };
    
    return JSON.stringify(fingerprintData);
  }

  /**
   * Get device type from parsed result
   */
  private getDeviceType(result: any): string {
    if (result.device?.type) {
      return result.device.type;
    }
    
    if (result.client?.type === 'browser') {
      return 'desktop';
    }
    
    return 'unknown';
  }

  /**
   * Get readable device name
   */
  private getDeviceName(result: any): string {
    const brand = result.device?.brand || '';
    const model = result.device?.model || '';
    const os = result.os?.name || '';
    
    if (brand && model) {
      return `${brand} ${model}`;
    }
    
    if (os) {
      return os;
    }
    
    return 'Unknown Device';
  }

  /**
   * Extract IP address from request
   */
  private getIpAddress(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      'unknown'
    ).split(',')[0];
  }
}
