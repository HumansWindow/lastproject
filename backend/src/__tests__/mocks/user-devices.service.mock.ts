import { Injectable } from '@nestjs/common';
import { UserDevice } from '../../users/entities/user-device.entity';

@Injectable()
export class UserDevicesServiceMock {
  // Mock implementation methods
  create = jest.fn().mockResolvedValue({});
  update = jest.fn().mockResolvedValue({});
  delete = jest.fn().mockResolvedValue({});
  
  // Replace both implementations with a single Jest mock function
  findByDeviceId = jest.fn().mockResolvedValue([]);
  
  findByUserIdAndDeviceId = jest.fn().mockResolvedValue(null);
  
  async createOrUpdateDevice(userId: string, deviceInfo: any): Promise<UserDevice> {
    return {
      id: 'mock-device-id',
      userId,
      deviceId: deviceInfo.deviceId || 'test-device-id',
      deviceType: deviceInfo.device?.type || 'desktop',
      browser: deviceInfo.client?.name || 'Test Browser',
      os: deviceInfo.os?.name || 'Test OS',
      lastIp: deviceInfo.ipAddress || '127.0.0.1',
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true,
      user: null,
      userAgent: deviceInfo.userAgent || 'TestUserAgent/1.0',
      visitCount: 1,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    } as unknown as UserDevice;
  }

  async getActiveDevicesByUser(_userId: string): Promise<UserDevice[]> {
    return []; // Return empty array instead of null
  }

  async findDeviceByDeviceId(_deviceId: string): Promise<UserDevice | null> {
    return null; // Return null to simulate new device
  }

  async getDevicesByUserId(_userId: string): Promise<UserDevice[]> {
    return [];
  }
  
  // Add the missing registerDevice method
  registerDevice = jest.fn().mockImplementation((userId: string, deviceId: string, deviceInfo: any) => {
    return Promise.resolve({
      id: 'device-id',
      userId,
      deviceId,
      deviceType: deviceInfo?.deviceType || 'unknown',
      name: deviceInfo?.deviceName || 'unknown',
      platform: deviceInfo?.platform || 'unknown',
      os: deviceInfo?.os || 'unknown',
      osVersion: deviceInfo?.osVersion || 'unknown',
      browser: deviceInfo?.browser || 'unknown',
      browserVersion: deviceInfo?.browserVersion || 'unknown',
      lastIpAddress: deviceInfo?.ipAddress || 'unknown',
      firstSeen: new Date(),
      lastSeen: new Date(),
      isActive: true,
      visitCount: 1,
      some: jest.fn(), // Add this to satisfy the interface
    });
  });
}
