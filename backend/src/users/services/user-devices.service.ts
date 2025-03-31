import { Injectable, Logger, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
        where: { deviceId: deviceId },
      });
      return devices;
    } catch (error) {
      this.logger.error(`Error finding device by deviceId: ${error.message}`);
      throw error;
    }
  }

  async findByUserIdAndDeviceId(userId: string | number, deviceId: string): Promise<UserDevice | null> {
    try {
      const device = await this.userDeviceRepository.findOne({
        where: {
          userId: userId.toString(),
          deviceId: deviceId,
        },
      });
      
      return device || null;
    } catch (error) {
      this.logger.error(`Error finding device by userId and deviceId: ${error.message}`);
      return null;
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
    try {
      const device = await this.userDeviceRepository.findOne({ where: { id } });
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }
      
      await this.userDeviceRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete device: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete device');
    }
  }

  async registerDevice(userId: string | number, deviceId: string, deviceInfo: any): Promise<UserDevice> {
    this.logger.log(`Device registration attempt - UserId: ${userId}, DeviceId: ${deviceId.substring(0, 8)}...`);
    
    try {
      // Check for existing devices with this ID
      let devices;
      try {
        devices = await this.findByDeviceId(deviceId);
      } catch (error) {
        this.logger.error(`Error querying for existing devices: ${error.message}`);
        devices = [];
      }

      // If device already exists for this user, update it
      const userDevice = devices.find(device => device.userId?.toString() === userId?.toString());
      if (userDevice) {
        // Update last seen and visit count
        userDevice.lastSeen = new Date();
        userDevice.lastSeenAt = new Date();
        userDevice.visitCount += 1;
        userDevice.isActive = true;
        
        // Update device info if provided
        if (deviceInfo) {
          if (deviceInfo.deviceType) userDevice.deviceType = deviceInfo.deviceType;
          if (deviceInfo.platform) userDevice.platform = deviceInfo.platform;
          if (deviceInfo.os) userDevice.os = deviceInfo.os;
          if (deviceInfo.osVersion) userDevice.osVersion = deviceInfo.osVersion;
          if (deviceInfo.browser) userDevice.browser = deviceInfo.browser;
          if (deviceInfo.browserVersion) userDevice.browserVersion = deviceInfo.browserVersion;
          if (deviceInfo.lastIpAddress) userDevice.lastIpAddress = deviceInfo.lastIpAddress;
        }
        
        await this.userDeviceRepository.save(userDevice);
        this.logger.log(`Updated existing device record for userId: ${userId}`);
        return userDevice;
      }
      
      // Create new device record
      this.logger.log(`Creating new device record for user ${userId}`);

      const newDevice = this.userDeviceRepository.create({
        userId: userId.toString(),
        deviceId: deviceId,
        deviceType: deviceInfo?.deviceType || 'unknown',
        name: deviceInfo?.deviceName || deviceInfo?.name || 'Unknown device',
        platform: deviceInfo?.platform || 'unknown',
        os: deviceInfo?.os || 'unknown',
        osVersion: deviceInfo?.osVersion || 'unknown',
        browser: deviceInfo?.browser || 'unknown',
        browserVersion: deviceInfo?.browserVersion || 'unknown',
        lastIpAddress: deviceInfo?.lastIpAddress || null,
        isActive: true,
        visitCount: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
      
      return await this.userDeviceRepository.save(newDevice);
    } catch (error) {
      this.logger.error(`Failed to register device: ${error.message}`);
      throw new InternalServerErrorException('Failed to register device');
    }
  }

  async removeDevice(deviceId: string, userId: string): Promise<void> {
    const devices = await this.findByDeviceId(deviceId);
    const device = devices.find(d => d.userId === userId);
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    
    await this.userDeviceRepository.remove(device);
  }

  // Check if this device can be used with this wallet address
  async validateDeviceWalletPairing(deviceId: string, walletAddress: string, userId?: string): Promise<boolean> {
    // Always log the validation attempt
    this.logger.log(`Validating device-wallet pairing - DeviceId: ${deviceId.substring(0, 8)}..., WalletAddress: ${walletAddress.substring(0, 8)}...`);
    
    // Normalize wallet address for comparison (convert to lowercase)
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Skip check if configured to do so
    const skipDeviceCheck = this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true' ||
                          this.configService.get<string>('NODE_ENV') === 'development' ||
                          this.configService.get<string>('NODE_ENV') === 'test';
                          
    if (skipDeviceCheck) {
      this.logger.warn('Skipping device-wallet pairing validation due to configuration');
      return true;
    }
    
    try {
      const existingDevices = await this.findByDeviceId(deviceId);
      
      // If no devices found, this is a new device, so it's valid
      if (!existingDevices || existingDevices.length === 0) {
        this.logger.log(`New device ${deviceId.substring(0, 8)}... - no previous wallet associations`);
        return true;
      }
      
      // First check if this is the same user reconnecting with their device
      if (userId) {
        const userOwnDevice = existingDevices.find(device => device.userId === userId);
        if (userOwnDevice) {
          // If the user is reconnecting to their own device, check the wallet address
          if (userOwnDevice.walletAddresses) {
            try {
              const walletAddresses = JSON.parse(userOwnDevice.walletAddresses);
              // Check if the wallet is already associated with this device for this user
              if (walletAddresses.includes(normalizedWalletAddress)) {
                this.logger.log(`User ${userId} reconnecting with existing wallet ${walletAddress.substring(0, 8)}...`);
                return true;
              }
              
              // If the user has other wallets on this device but not this one,
              // it breaks our one-wallet-per-device policy
              if (walletAddresses.length > 0) {
                this.logger.warn(`User ${userId} attempting to use a new wallet ${walletAddress.substring(0, 8)}... on device ${deviceId.substring(0, 8)}...`);
                this.logger.warn(`Device already has wallets: ${walletAddresses.join(', ')}`);
                return false;
              }
            } catch (error) {
              this.logger.error(`Error parsing wallet addresses: ${error.message}`);
            }
          }
        }
      }
      
      // Now check all devices with this ID (including other users' devices)
      for (const device of existingDevices) {
        // Skip devices belonging to this user (we already checked them above)
        if (userId && device.userId === userId) {
          continue;
        }
        
        // If this device belongs to another user or has wallet addresses
        if (device.walletAddresses) {
          try {
            const walletAddresses = JSON.parse(device.walletAddresses);
            
            // If the device has any wallets, block new associations
            // This enforces the one-device-one-wallet policy
            if (walletAddresses.length > 0) {
              // Only allow if this exact wallet is already associated
              if (walletAddresses.includes(normalizedWalletAddress)) {
                // This means the wallet is trying to reconnect from the same device
                // Could happen if user cleared browser data
                this.logger.log(`Wallet ${walletAddress.substring(0, 8)}... reconnecting from existing device ${deviceId.substring(0, 8)}...`);
                return true;
              } else {
                // Different wallet trying to use the same device - BLOCKED
                this.logger.warn(`Device ${deviceId.substring(0, 8)}... is already bound to different wallet(s): ${walletAddresses.map(w => w.substring(0, 8)+'...').join(', ')}`);
                return false;
              }
            }
          } catch (error) {
            this.logger.error(`Error parsing wallet addresses for device: ${error.message}`);
          }
        }
        
        // If device belongs to another user but doesn't have wallets yet, block it
        // This prevents device sharing between different users
        if (device.userId && (!userId || device.userId !== userId)) {
          this.logger.warn(`Device ${deviceId.substring(0, 8)}... belongs to user ${device.userId}, not ${userId || 'new user'}`);
          return false;
        }
      }
      
      // If we reach here, the device doesn't have conflicting wallet associations
      this.logger.log(`Device-wallet pairing validated for ${walletAddress.substring(0, 8)}... on device ${deviceId.substring(0, 8)}...`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error validating device-wallet pairing: ${error.message}`);
      // In case of error, we should refuse the pairing to be safe
      return false;
    }
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
