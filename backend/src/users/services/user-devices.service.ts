import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice } from '../entities/user-device.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserDevicesService {
  private readonly logger = new Logger(UserDevicesService.name);
  
  constructor(
    @InjectRepository(UserDevice)
    private readonly userDeviceRepository: Repository<UserDevice>,
    private configService: ConfigService,
  ) {}

  async create(data: Partial<UserDevice>): Promise<UserDevice> {
    try {
      // Before creating, check if this device is associated with other users
      if (data.deviceId && data.userId) {
        const existingDevices = await this.findByDeviceId(data.deviceId);
        
        if (existingDevices && existingDevices.length > 0) {
          // Check if any device belongs to another user
          const belongsToOtherUser = existingDevices.some(device => 
            device.userId && device.userId !== data.userId);
            
          if (belongsToOtherUser) {
            this.logger.warn(`Device ${data.deviceId.substring(0, 8)}... is already registered to another user`);
            throw new ForbiddenException('This device has already been registered with another wallet address');
          }
        }
      }
      
      const device = this.userDeviceRepository.create(data);
      return await this.userDeviceRepository.save(device);
    } catch (error) {
      this.logger.error(`Error creating user device: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<UserDevice> {
    return this.userDeviceRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<UserDevice[]> {
    return this.userDeviceRepository.find({ where: { userId } });
  }

  async findByDeviceId(deviceId: string): Promise<UserDevice[]> {
    try {
      const devices = await this.userDeviceRepository.find({
        where: { deviceId }
      });
      
      this.logger.log(`Found ${devices.length} devices with ID ${deviceId.substring(0, 8)}...`);
      return devices;
    } catch (error) {
      this.logger.error(`Error finding device by deviceId: ${error.message}`);
      throw error;
    }
  }

  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<UserDevice | null> {
    try {
      return await this.userDeviceRepository.findOne({
        where: { userId, deviceId },
      });
    } catch (error) {
      this.logger.error(`Error finding device by userId and deviceId: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, data: Partial<UserDevice>): Promise<UserDevice> {
    try {
      await this.userDeviceRepository.update(id, data);
      return this.userDeviceRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Error updating user device: ${error.message}`);
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    await this.userDeviceRepository.update(id, { isActive: false });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.userDeviceRepository.count({
      where: { userId, isActive: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.userDeviceRepository.delete(id);
  }

  async registerDevice(userId: string, deviceId: string, deviceInfo: any): Promise<UserDevice> {
    // Always log the registration attempt with detailed info
    this.logger.log(`Device registration attempt - UserId: ${userId}, DeviceId: ${deviceId.substring(0, 8)}...`);
    
    // Check if we're in development/test mode or explicitly configured to skip device check
    const isDevelopmentMode = this.configService.get<string>('NODE_ENV') === 'development';
    const isTestMode = this.configService.get<string>('NODE_ENV') === 'test';
    const skipDeviceCheck = isDevelopmentMode || 
                          isTestMode || 
                          this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true';

    // First, find any existing devices with this device ID
    const existingDevices = await this.findByDeviceId(deviceId);
    
    if (existingDevices.length > 0) {
      // Log all found devices for debugging purposes
      existingDevices.forEach(device => {
        this.logger.log(`Found existing device: DeviceID: ${deviceId.substring(0, 8)}..., UserId: ${device.userId}`);
      });
      
      // Check if any device is associated with another user ID
      const otherUserDevice = existingDevices.find(device => device.userId !== userId && device.userId !== null);
      
      if (otherUserDevice) {
        this.logger.warn(`Device ${deviceId.substring(0, 8)}... is already associated with user ${otherUserDevice.userId}`);
        
        if (!skipDeviceCheck) {
          // Production behavior: Throw an error
          throw new ForbiddenException('This device has already been registered with another wallet address');
        } else {
          this.logger.warn(`Device check bypassed in ${this.configService.get<string>('NODE_ENV')} environment for userId: ${userId}`);
        }
      }
      
      // If device exists but belongs to the same user, just update it
      const userDevice = existingDevices.find(device => device.userId === userId);
      if (userDevice) {
        this.logger.log(`Updating existing device for user ${userId}`);
        userDevice.lastSeen = new Date();
        userDevice.visitCount = (userDevice.visitCount || 0) + 1;
        return this.userDeviceRepository.save(userDevice);
      }
    }
    
    // If no blocking conditions were found, create a new device record
    this.logger.log(`Creating new device record for user ${userId}`);
    const device = this.userDeviceRepository.create({
      userId,
      deviceId,
      deviceType: deviceInfo.deviceType || 'unknown',
      name: deviceInfo.deviceName || 'unknown',
      platform: deviceInfo.platform || 'unknown',
      os: deviceInfo.os || 'unknown',
      osVersion: deviceInfo.osVersion || 'unknown',
      browser: deviceInfo.browser || 'unknown',
      browserVersion: deviceInfo.browserVersion || 'unknown',
      userAgent: deviceInfo.userAgent || 'unknown',
      firstSeen: new Date(),
      lastSeen: new Date(),
      visitCount: 1,
      isActive: true,
    });
    
    return this.userDeviceRepository.save(device);
  }

  async removeDevice(deviceId: string, userId: string): Promise<void> {
    const device = await this.userDeviceRepository.findOne({ 
      where: { deviceId, userId } 
    });
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    
    await this.userDeviceRepository.remove(device);
  }

  // Check if this device can be used with this wallet address
  async validateDeviceWalletPairing(deviceId: string, walletAddress: string, userId?: string): Promise<boolean> {
    // Always log the validation attempt
    this.logger.log(`Validating device-wallet pairing - DeviceId: ${deviceId.substring(0, 8)}..., WalletAddress: ${walletAddress}`);
    
    // Skip check if configured to do so
    const skipDeviceCheck = this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true' ||
                          this.configService.get<string>('NODE_ENV') === 'development' ||
                          this.configService.get<string>('NODE_ENV') === 'test';
                          
    if (skipDeviceCheck) {
      this.logger.warn('Skipping device-wallet pairing validation due to configuration');
      return true;
    }
    
    const existingDevices = await this.findByDeviceId(deviceId);
    
    // If no devices found, this is a new device, so it's valid
    if (existingDevices.length === 0) {
      return true;
    }
    
    // If we have a userId, check if device belongs to this user
    if (userId) {
      const belongsToUser = existingDevices.some(device => device.userId === userId);
      if (belongsToUser) {
        return true;
      }
    }
    
    // Otherwise, device is already registered to someone else
    this.logger.warn(`Device ${deviceId.substring(0, 8)}... is already registered to another user`);
    return false;
  }

  /**
   * Reset all device associations for a user
   * This allows the user to use a new device after resetting
   * @param userId The ID of the user
   * @returns Information about the reset operation
   */
  async resetDeviceAssociations(userId: string): Promise<{ success: boolean, message: string }> {
    try {
      this.logger.log(`Resetting device associations for user ${userId}`);
      
      // Find all devices for this user
      const devices = await this.userDeviceRepository.find({
        where: { userId, isActive: true }
      });
      
      if (!devices || devices.length === 0) {
        return { 
          success: false, 
          message: 'No active devices found for this user' 
        };
      }
      
      // Deactivate all devices
      const updatePromises = devices.map(device => 
        this.userDeviceRepository.update(
          { id: device.id },
          { 
            isActive: false,
            walletAddresses: null // Clear wallet associations
          }
        )
      );
      
      await Promise.all(updatePromises);
      
      this.logger.log(`Reset ${devices.length} device associations for user ${userId}`);
      
      return {
        success: true,
        message: `Successfully reset ${devices.length} device associations`
      };
    } catch (error) {
      this.logger.error(`Error resetting device associations: ${error.message}`);
      throw error;
    }
  }
}
