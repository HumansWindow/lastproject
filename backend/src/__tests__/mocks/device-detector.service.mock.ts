import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceDetectorServiceMock {
  detect(userAgent?: string, ipAddress?: string) {
    return {
      client: {
        type: 'browser',
        name: 'Test Browser',
        version: '1.0.0',
        engine: 'Test Engine',
        engineVersion: '1.0.0',
      },
      os: {
        name: 'Test OS',
        version: '1.0.0',
        platform: 'test',
      },
      device: {
        type: 'desktop',
        brand: 'Test Brand',
        model: 'Test Model',
      },
      bot: null,
      deviceId: 'test-device-id-123456',
      userAgent: userAgent || 'TestUserAgent/1.0',
      ipAddress: ipAddress || '127.0.0.1',
    };
  }

  getDeviceId(_userAgent?: string, _ipAddress?: string) {
    return 'test-device-id-123456';
  }

  generateDeviceId(_userAgent?: string, _ipAddress?: string) {
    return 'test-device-id-123456';
  }
}
