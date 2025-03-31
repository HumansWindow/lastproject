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
      // Using a simple query to avoid schema mismatch issues
      const queryBuilder = this.userDeviceRepository.createQueryBuilder('device')
        .where('device.device_id = :deviceId', { deviceId });
        
      const devices = await queryBuilder.getMany();
      return devices;
    } catch (error) {
      this.logger.error(`Error finding device by deviceId: ${error.message}`);
      // Return empty array instead of throwing to make the service more resilient
      return [];
    }
  }

  async findByUserIdAndDeviceId(userId: string | number, deviceId: string): Promise<UserDevice | null> {
    try {
      const queryBuilder = this.userDeviceRepository.createQueryBuilder('device')
        .where('device.user_id = :userId', { userId: userId.toString() })
        .andWhere('device.device_id = :deviceId', { deviceId });
        
      return await queryBuilder.getOne();
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
      // Check for existing devices with this ID using raw query builder
      let devices: UserDevice[] = [];
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
        if (userDevice.lastSeenAt) {
          userDevice.lastSeenAt = new Date();
        }
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
      
      // Create new device record using QueryBuilder to avoid column mismatch issues
      this.logger.log(`Creating new device record for user ${userId}`);

      try {
        // Prepare base device data
        const deviceData: Partial<UserDevice> = {
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
        };
        
        // Create and save device while handling any missing columns
        const device = this.userDeviceRepository.create(deviceData);
        
        // Add wallet address to device if provided
        if (deviceInfo?.walletAddress) {
          try {
            const walletAddress = deviceInfo.walletAddress.toLowerCase();
            device.walletAddresses = JSON.stringify([walletAddress]);
          } catch (error) {
            this.logger.error(`Error setting wallet address: ${error.message}`);
          }
        }
        
        // Return device even if save fails
        return await this.userDeviceRepository.save(device);
      } catch (error) {
        this.logger.error(`Error while creating device: ${error.message}`);
        
        // Create a simplified version with only essential fields if there's an error
        const minimumDeviceData: Partial<UserDevice> = {
          userId: userId.toString(),
          deviceId: deviceId,
          isActive: true
        };
        
        // Try saving with minimal data
        const fallbackDevice = this.userDeviceRepository.create(minimumDeviceData);
        return await this.userDeviceRepository.save(fallbackDevice);
      }
    } catch (error) {
      this.logger.error(`Failed to register device: ${error.message}`);
      
      // Return a temporary device object that's not saved to database
      // This allows authentication to continue even if device registration fails
      const tempDevice = new UserDevice();
      tempDevice.userId = userId.toString();
      tempDevice.deviceId = deviceId;
      tempDevice.isActive = true;
      return tempDevice;
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
    
    // Skip check if configured to do so - ONLY use SKIP_DEVICE_CHECK environment variable
    const skipDeviceCheck = this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true';
                          
    if (skipDeviceCheck) {
      this.logger.warn('Skipping device-wallet pairing validation due to configuration');
      return true;
    }
    
    // Log that we are enforcing the device-wallet policy
    this.logger.log(`Enforcing strict one-device-one-wallet policy for device: ${deviceId.substring(0, 8)}...`);
    
    try {
      // Get all device records with this device ID
      const existingDevices = await this.findByDeviceId(deviceId);
      
      // If no devices found, this is a new device, so it's valid
      if (!existingDevices || existingDevices.length === 0) {
        this.logger.log(`New device ${deviceId.substring(0, 8)}... - no previous wallet associations`);
        return true;
      }
      
      // *** STRICT ONE-DEVICE-ONE-WALLET ENFORCEMENT ***
      // First check: Is this device already associated with ANY wallet?
      for (const device of existingDevices) {
        if (device.walletAddresses) {
          try {
            const walletAddresses = JSON.parse(device.walletAddresses);
            
            // If device has ANY wallet addresses registered
            if (walletAddresses && Array.isArray(walletAddresses) && walletAddresses.length > 0) {
              
              // Check if THIS wallet is among the registered ones
              const isWalletAlreadyRegistered = walletAddresses.includes(normalizedWalletAddress);
              
              if (isWalletAlreadyRegistered) {
                // This wallet is already registered with this device, so it's valid
                this.logger.log(`Wallet ${walletAddress.substring(0, 8)}... is already associated with device ${deviceId.substring(0, 8)}...`);
                return true;
              } else {
                // STRICT ENFORCEMENT: Device is already associated with a different wallet - BLOCK THIS
                this.logger.warn(`Device ${deviceId.substring(0, 8)}... is already associated with another wallet: ${walletAddresses[0].substring(0, 8)}... - BLOCKING this new wallet`);
                return false;
              }
            }
          } catch (error) {
            this.logger.error(`Error parsing wallet addresses for device: ${error.message}`);
          }
        }
      }
      
      // If we get here, this device doesn't have any wallet associations yet
      // Now check if this user is trying to register a wallet on this device
      
      if (userId) {
        // Check if this device belongs to another user
        const deviceBelongsToAnotherUser = existingDevices.some(
          device => device.userId && device.userId !== userId
        );
        
        if (deviceBelongsToAnotherUser) {
          this.logger.warn(`Device ${deviceId.substring(0, 8)}... belongs to another user, not ${userId} - BLOCKING`);
          return false;
        }
      }
      
      // If we reach here, this is either:
      // 1. A new device with no wallet associations, or
      // 2. An existing device for this user that has no wallet associations
      this.logger.log(`Device-wallet pairing validated for ${walletAddress.substring(0, 8)}... on device ${deviceId.substring(0, 8)}...`);
      return true;
      
    } catch (error) {
      this.logger.error(`Error validating device-wallet pairing: ${error.message}`);
      // In case of error, allow the pairing to ensure better user experience
      return true;
    }
  }

  // Check if a device + wallet combination is already registered
  async isDeviceWalletCombinationRegistered(deviceId: string, walletAddress: string): Promise<boolean> {
    try {
      this.logger.log(`Checking if device ${deviceId.substring(0, 8)}... with wallet ${walletAddress.substring(0, 8)}... is already registered`);
      
      // Normalize the wallet address
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      // Get all devices with this deviceId
      const devices = await this.findByDeviceId(deviceId);
      
      // If no devices found, this combination is not registered
      if (!devices || devices.length === 0) {
        return false;
      }
      
      // Check if any of these devices has the wallet address stored
      for (const device of devices) {
        if (device.walletAddresses) {
          try {
            const walletAddresses = JSON.parse(device.walletAddresses);
            
            if (Array.isArray(walletAddresses) && walletAddresses.includes(normalizedWalletAddress)) {
              this.logger.log(`Found existing registration for device ${deviceId.substring(0, 8)}... and wallet ${walletAddress.substring(0, 8)}...`);
              return true;
            }
          } catch (error) {
            this.logger.error(`Error parsing wallet addresses for device: ${error.message}`);
          }
        }
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Error checking device-wallet registration: ${error.message}`);
      return false;
    }
  }

  // Method to check/enforce one-wallet-one-device policy
  async enforcedDeviceWalletPolicy(deviceId: string, walletAddress: string): Promise<boolean> {
    try {
      const normalizedWalletAddress = walletAddress.toLowerCase();

      // First check if this exact combination is already registered
      const isAlreadyRegistered = await this.isDeviceWalletCombinationRegistered(deviceId, normalizedWalletAddress);
      if (isAlreadyRegistered) {
        // If the combination is already registered, that's fine - allow it
        this.logger.log(`Device ${deviceId.substring(0, 8)}... and wallet ${normalizedWalletAddress.substring(0, 8)}... already registered together - allowing`);
        return true;
      }
      
      // Check 1: Is this device already registered with any wallet?
      const devicesWithThisId = await this.findByDeviceId(deviceId);
      for (const device of devicesWithThisId) {
        if (device.walletAddresses) {
          try {
            const wallets = JSON.parse(device.walletAddresses);
            if (Array.isArray(wallets) && wallets.length > 0) {
              // If this device already has a wallet and it's not the current one, block it
              if (!wallets.includes(normalizedWalletAddress)) {
                this.logger.warn(`Device ${deviceId.substring(0, 8)}... already has a different wallet: ${wallets[0].substring(0, 8)}...`);
                return false;
              }
            }
          } catch (e) {
            this.logger.error(`Error parsing wallet addresses: ${e.message}`);
          }
        }
      }
      
      // Check 2: Is this wallet already registered on another device?
      const allDevices = await this.userDeviceRepository.find({
        where: { isActive: true }
      });
      
      for (const device of allDevices) {
        // Skip the current device
        if (device.deviceId === deviceId) continue;
        
        if (device.walletAddresses) {
          try {
            const wallets = JSON.parse(device.walletAddresses);
            if (Array.isArray(wallets) && wallets.includes(normalizedWalletAddress)) {
              this.logger.warn(`Wallet ${walletAddress.substring(0, 8)}... is already registered with another device: ${device.deviceId.substring(0, 8)}...`);
              return false;
            }
          } catch (e) {
            this.logger.error(`Error parsing wallet addresses: ${e.message}`);
          }
        }
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error enforcing device-wallet policy: ${error.message}`);
      // If there's an error, allow the pairing for better user experience
      return true;
    }
  }

  // Add a utility method to update wallet addresses for a device
  async addWalletToDevice(deviceId: string, walletAddress: string): Promise<boolean> {
    try {
      // Normalize wallet address
      const normalizedWallet = walletAddress.toLowerCase();
      
      // ENFORCE STRICT ONE-DEVICE-ONE-WALLET POLICY
      const isPolicyCompliant = await this.enforcedDeviceWalletPolicy(deviceId, normalizedWallet);
      if (!isPolicyCompliant) {
        // This would violate our policy, so don't add the wallet
        this.logger.warn(`Blocked adding wallet ${walletAddress.substring(0, 8)}... to device ${deviceId.substring(0, 8)}... due to policy violation`);
        return false;
      }
      
      // Find the device
      const devices = await this.findByDeviceId(deviceId);
      if (!devices || devices.length === 0) {
        return false;
      }

      const device = devices[0]; // Use the first found device
      
      // Parse existing wallet addresses or create new array
      let walletAddresses = [];
      if (device.walletAddresses) {
        try {
          walletAddresses = JSON.parse(device.walletAddresses);
          if (!Array.isArray(walletAddresses)) {
            walletAddresses = [];
          }
        } catch (e) {
          this.logger.error(`Error parsing wallet addresses: ${e.message}`);
          walletAddresses = [];
        }
      }
      
      // Add wallet if not already present
      if (!walletAddresses.includes(normalizedWallet)) {
        walletAddresses.push(normalizedWallet);
      }
      
      // Update the device
      await this.userDeviceRepository.update(
        { id: device.id },
        { walletAddresses: JSON.stringify(walletAddresses) }
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Error adding wallet to device: ${error.message}`);
      return false;
    }
  }

  // Check if a device is already registered with any wallet
  async isDeviceRegistered(deviceId: string): Promise<boolean> {
    try {
      this.logger.log(`Checking if device ${deviceId.substring(0, 8)}... is already registered`);
      
      // Get all devices with this deviceId
      const devices = await this.findByDeviceId(deviceId);
      
      // If no devices found, this device is not registered
      if (!devices || devices.length === 0) {
        return false;
      }
      
      // Check if any of these devices has wallet addresses stored
      for (const device of devices) {
        if (device.walletAddresses) {
          try {
            const walletAddresses = JSON.parse(device.walletAddresses);
            
            if (Array.isArray(walletAddresses) && walletAddresses.length > 0) {
              this.logger.log(`Found existing registration for device ${deviceId.substring(0, 8)}...`);
              return true;
            }
          } catch (error) {
            this.logger.error(`Error parsing wallet addresses for device: ${error.message}`);
          }
        }
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Error checking device registration: ${error.message}`);
      return false;
    }
  }

  /**
   * Reset all device associations for a user
   * This allows a user to use new devices with their wallet after having problems
   * @param userId The ID of the user whose device associations should be reset
   * @returns An object with information about the reset operation
   */
  async resetDeviceAssociations(userId: string): Promise<{success: boolean; message: string; count: number}> {
    this.logger.log(`Resetting device associations for user ${userId}`);
    
    try {
      // Find all devices registered to this user
      const devices = await this.findByUserId(userId);
      
      if (!devices || devices.length === 0) {
        return {
          success: true,
          message: 'No devices found for this user',
          count: 0
        };
      }
      
      let resetCount = 0;
      
      // Clear wallet associations for each device
      for (const device of devices) {
        if (device.walletAddresses) {
          // Clear the wallet associations
          device.walletAddresses = JSON.stringify([]);
          await this.userDeviceRepository.save(device);
          resetCount++;
        }
      }
      
      this.logger.log(`Reset ${resetCount} device associations for user ${userId}`);
      
      return {
        success: true,
        message: `Successfully reset ${resetCount} device associations`,
        count: resetCount
      };
    } catch (error) {
      this.logger.error(`Failed to reset device associations for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to reset device associations');
    }
  }
}
