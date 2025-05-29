import { Injectable, Logger, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
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

  /**
   * Create a new user device
   */
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

  /**
   * Find a device by ID
   */
  async findById(id: string): Promise<UserDevice> {
    return this.userDeviceRepository.findOne({ where: { id } });
  }

  /**
   * Find all devices for a user
   */
  
  /**
   * Find by user ID
   * @param userId The user ID to search for
   * @returns Matching records for the user
   * @deprecated Use findByUserId instead with property name (not DB column)
   */
  
  /**
   * Find by user ID
   * @param userId The user ID to search for
   * @returns Matching records for the user
   * @deprecated Use findByUserId instead with property name (not DB column)
   */
  async findByUserId(userId: string): Promise<UserDevice[]> {
    return this.userDeviceRepository.find({ where: { userId } });
  }

  /**
   * Find devices by device ID
   */
  
  /**
   * Find devices by device ID
   * @param deviceId The device ID to search for
   * @returns An array of matching devices
   * @deprecated Use findByDeviceId instead with property name (not DB column)
   */
  
  /**
   * Find devices by device ID
   * @param deviceId The device ID to search for
   * @returns An array of matching devices
   * @deprecated Use findByDeviceId instead with property name (not DB column)
   */
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

  /**
   * Find a device by user ID and device ID
   */
  
  /**
   * Find by user ID and device ID
   * @param userId The user ID to search for
   * @param deviceId The device ID to search for
   * @returns The matching record if found, null otherwise
   * @deprecated Use findByUserIdAndDeviceId with property names (not DB columns)
   */
  
  /**
   * Find by user ID and device ID
   * @param userId The user ID to search for
   * @param deviceId The device ID to search for
   * @returns The matching record if found, null otherwise
   * @deprecated Use findByUserIdAndDeviceId with property names (not DB columns)
   */
  async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<UserDevice | null> {
    try {
      // Always treat userId as a UUID string
      const queryBuilder = this.userDeviceRepository.createQueryBuilder('device')
        .where('device.user_id = :userId', { userId })
        .andWhere('device.device_id = :deviceId', { deviceId });
        
      return await queryBuilder.getOne();
    } catch (error) {
      this.logger.error(`Error finding device by userId and deviceId: ${error.message}`);
      return null;
    }
  }

  /**
   * Update a device
   */
  async update(id: string, data: Partial<UserDevice>): Promise<UserDevice> {
    try {
      await this.userDeviceRepository.update(id, data);
      return this.userDeviceRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Error updating user device: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deactivate a device
   */
  async deactivate(id: string): Promise<void> {
    await this.userDeviceRepository.update(id, { isActive: false });
  }

  /**
   * Count active devices for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.userDeviceRepository.count({
      where: { userId, isActive: true },
    });
  }

  /**
   * Delete a device
   */
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

  /**
   * Register a device for a user
   */
  async registerDevice(userId: string, deviceId: string, deviceInfo: any): Promise<UserDevice> {
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
      const userDevice = devices.find(device => device.userId === userId);
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
          userId, // Already treating as UUID string
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
          userId,
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
      tempDevice.userId = userId;
      tempDevice.deviceId = deviceId;
      tempDevice.isActive = true;
      return tempDevice;
    }
  }

  /**
   * Register a device for a user within a transaction
   * This method is used when registering devices as part of a larger transaction
   */
  async registerDeviceWithTransaction(
    entityManager: EntityManager,
    userId: string, 
    deviceId: string, 
    deviceInfo: any
  ): Promise<UserDevice> {
    this.logger.log(`Transactional device registration - UserId: ${userId}, DeviceId: ${deviceId.substring(0, 8)}...`);
    
    try {
      // Check for existing devices with this ID using the entity manager
      const devices = await entityManager.find(UserDevice, {
        where: { deviceId }
      });
      
      // If device already exists for this user, update it
      const userDevice = devices.find(device => device.userId === userId);
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
        
        await entityManager.save(userDevice);
        this.logger.log(`Updated existing device record for userId: ${userId} within transaction`);
        return userDevice;
      }
      
      // Create new device record
      this.logger.log(`Creating new device record for user ${userId} within transaction`);
      try {
        // Prepare base device data
        const deviceData: Partial<UserDevice> = {
          userId,
          deviceId,
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
        
        // Create device using the entity manager
        const device = entityManager.create(UserDevice, deviceData);
        
        // Add wallet address to device if provided
        if (deviceInfo?.walletAddress) {
          try {
            const walletAddress = deviceInfo.walletAddress.toLowerCase();
            device.walletAddresses = JSON.stringify([walletAddress]);
          } catch (error) {
            this.logger.error(`Error setting wallet address within transaction: ${error.message}`);
          }
        }
        
        // Save using entity manager
        return await entityManager.save(device);
      } catch (error) {
        this.logger.error(`Error while creating device within transaction: ${error.message}`);
        
        // Create a simplified version with only essential fields if there's an error
        const minimumDeviceData: Partial<UserDevice> = {
          userId,
          deviceId,
          isActive: true
        };
        
        // Try saving with minimal data using entity manager
        const fallbackDevice = entityManager.create(UserDevice, minimumDeviceData);
        return await entityManager.save(fallbackDevice);
      }
    } catch (error) {
      this.logger.error(`Failed to register device within transaction: ${error.message}`);
      throw error; // Let the transaction handle the error
    }
  }

  /**
   * Remove a device for a user
   */
  async removeDevice(deviceId: string, userId: string): Promise<void> {
    const devices = await this.findByDeviceId(deviceId);
    const device = devices.find(d => d.userId === userId);
    
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    
    await this.userDeviceRepository.remove(device);
  }

  /**
   * Check if this device can be used with this wallet address
   */
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

  /**
   * Reset all device associations for a user
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

  /**
   * Find or create a device record for a user
   */
  async findOrCreateDevice(data: {
    userId: string;
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: any;
  }): Promise<UserDevice> {
    try {
      this.logger.log(`Looking up or creating device - UserId: ${data.userId}, DeviceId: ${data.deviceId.substring(0, 8)}...`);
      
      // Check for existing devices with this ID
      const devices = await this.findByDeviceId(data.deviceId);
      
      // Check if any device belongs to this user
      const userDevice = devices.find(device => device.userId === data.userId);
      
      if (userDevice) {
        // Update last seen time and visit count for existing device
        userDevice.lastSeen = new Date();
        if (userDevice.lastSeenAt) {
          userDevice.lastSeenAt = new Date();
        }
        userDevice.visitCount += 1;
        
        // Update IP address if provided
        if (data.ipAddress) {
          userDevice.lastIpAddress = data.ipAddress;
        }
        
        // Update device info if provided
        if (data.deviceInfo) {
          if (data.deviceInfo.deviceType) userDevice.deviceType = data.deviceInfo.deviceType;
          if (data.deviceInfo.platform) userDevice.platform = data.deviceInfo.platform;
          if (data.deviceInfo.os) userDevice.os = data.deviceInfo.os;
          if (data.deviceInfo.osVersion) userDevice.osVersion = data.deviceInfo.osVersion;
          if (data.deviceInfo.browser) userDevice.browser = data.deviceInfo.browser;
          if (data.deviceInfo.browserVersion) userDevice.browserVersion = data.deviceInfo.browserVersion;
        }
        
        await this.userDeviceRepository.save(userDevice);
        this.logger.log(`Updated existing device for user ${data.userId}`);
        return userDevice;
      }
      
      // No existing device found for this user, create a new one
      const deviceData: Partial<UserDevice> = {
        userId: data.userId,
        deviceId: data.deviceId,
        deviceType: data.deviceInfo?.deviceType || 'unknown',
        name: data.deviceInfo?.deviceName || data.deviceInfo?.name || 'Unknown device',
        platform: data.deviceInfo?.platform || 'unknown',
        os: data.deviceInfo?.os || 'unknown',
        osVersion: data.deviceInfo?.osVersion || 'unknown',
        browser: data.deviceInfo?.browser || 'unknown',
        browserVersion: data.deviceInfo?.browserVersion || 'unknown',
        lastIpAddress: data.ipAddress || null,
        isActive: true,
        visitCount: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      };
      
      const newDevice = this.userDeviceRepository.create(deviceData);
      
      // Add wallet address to device if provided
      if (data.deviceInfo?.walletAddress) {
        try {
          await newDevice.addWalletAddress(data.deviceInfo.walletAddress);
        } catch (error) {
          this.logger.error(`Error setting wallet address: ${error.message}`);
        }
      }
      
      const savedDevice = await this.userDeviceRepository.save(newDevice);
      this.logger.log(`Created new device for user ${data.userId}`);
      return savedDevice;
      
    } catch (error) {
      this.logger.error(`Error finding or creating device: ${error.message}`);
      
      // Return a temporary device object if an error occurs
      // This allows authentication to continue even if device registration fails
      const tempDevice = new UserDevice();
      tempDevice.userId = data.userId;
      tempDevice.deviceId = data.deviceId;
      tempDevice.isActive = true;
      return tempDevice;
    }
  }

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
}
