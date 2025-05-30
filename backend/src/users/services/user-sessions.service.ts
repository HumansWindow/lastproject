import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserSessionsService {
  private readonly logger = new Logger(UserSessionsService.name);
  
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  /**
   * Create a new user session
   * @param data Session data
   */
  async createSession(data: {
    userId: string; // Always use UUID string for userId
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    token?: string;
    expiresAt?: Date;
  }): Promise<UserSession> {
    try {
      // Convert deviceId to UUID format for consistency
      let deviceUuid = data.deviceId;
      if (data.deviceId && !this.isUUID(data.deviceId)) {
        // Convert hash to UUID for storage
        deviceUuid = this.hashToUUID(data.deviceId);
        this.logger.log(`Converting device ID to UUID: ${data.deviceId.substring(0, 8)}... -> ${deviceUuid}`);
      }

      const sessionData = {
        userId: data.userId, // Use UUID string
        deviceId: deviceUuid || null, // Make deviceId optional to avoid foreign key constraint issues
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        token: data.token,
        expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry
      };

      const session = this.sessionRepository.create(sessionData);
      
      const savedSession = await this.sessionRepository.save(session);
      return Array.isArray(savedSession) ? savedSession[0] : savedSession;
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new user session within a transaction
   * This method is used when creating sessions as part of a larger transaction
   * @param entityManager The entity manager to use for the transaction
   * @param data Session data
   */
  async createSessionWithTransaction(
    entityManager: EntityManager,
    data: {
      userId: string; 
      deviceId?: string;
      ipAddress?: string;
      userAgent?: string;
      token?: string;
      expiresAt?: Date;
    }
  ): Promise<UserSession | null> {
    try {
      // Add request ID for tracing in logs
      const requestId = Math.random().toString(36).substring(2, 8);
      this.logger.log(`[${requestId}] Creating session within transaction for user: ${data.userId}`);
      
      // Convert deviceId to UUID format for consistency if provided
      let deviceUuid = null;
      if (data.deviceId) {
        if (!this.isUUID(data.deviceId)) {
          // Convert hash to UUID for storage
          deviceUuid = this.hashToUUID(data.deviceId);
          this.logger.log(`[${requestId}] Converting device ID to UUID: ${data.deviceId.substring(0, 8)}... -> ${deviceUuid}`);
        } else {
          deviceUuid = data.deviceId;
        }
      }

      // Create a session without a device ID to avoid foreign key constraints
      const sessionData = {
        userId: data.userId,
        // Make deviceId null to avoid foreign key constraint issues
        deviceId: null, 
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        token: data.token,
        expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry
      };

      // Create the session using the entity manager
      const session = entityManager.create(UserSession, sessionData);
      
      try {
        // Save the session using the entity manager
        const savedSession = await entityManager.save(session);
        this.logger.log(`[${requestId}] Successfully created session within transaction for user: ${data.userId}`);
        
        return Array.isArray(savedSession) ? savedSession[0] : savedSession;
      } catch (innerError) {
        // If we get a foreign key constraint error, try creating a session without device ID
        if (innerError.message && innerError.message.includes('foreign key constraint')) {
          this.logger.warn(`[${requestId}] Foreign key constraint error, creating session without device ID: ${innerError.message}`);
          
          // Try again without device ID
          session.deviceId = null;
          const savedSessionRetry = await entityManager.save(session);
          this.logger.log(`[${requestId}] Successfully created session without device ID for user: ${data.userId}`);
          
          return Array.isArray(savedSessionRetry) ? savedSessionRetry[0] : savedSessionRetry;
        } else {
          // If it's not a foreign key issue, rethrow
          throw innerError;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create session within transaction: ${error.message}`);
      // Don't throw here - let the auth flow continue even if session creation fails
      return null;
    }
  }

  /**
   * Find a session by token
   */
  async findByToken(token: string): Promise<UserSession | null> {
    const result = await this.sessionRepository.findOne({ where: { token } });
    return result || null;
  }

  /**
   * Find all sessions for a user
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
  async findByUserId(userId: string): Promise<UserSession[]> {
    // No need to convert userId to string since it should already be a string UUID
    return await this.sessionRepository.find({ where: { userId } });
  }

  /**
   * Find active sessions for a user
   */
  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return await this.sessionRepository.find({
      where: { 
        userId,
        isActive: true
      }
    });
  }

  /**
   * Find active sessions by device ID
   */
  async findActiveSessionsByDeviceId(deviceId: string): Promise<UserSession[]> {
    // Convert deviceId to UUID if needed
    let deviceUuid = deviceId;
    if (deviceId && !this.isUUID(deviceId)) {
      deviceUuid = this.hashToUUID(deviceId);
    }
    
    return await this.sessionRepository.find({
      where: { 
        deviceId: deviceUuid,
        isActive: true
      }
    });
  }

  /**
   * End all active sessions for a user
   */
  async endAllSessionsForUser(userId: string): Promise<number> {
    const result = await this.sessionRepository.update(
      { 
        userId,
        isActive: true
      },
      {
        isActive: false,
        endedAt: new Date(),
        duration: () => `EXTRACT(EPOCH FROM (NOW() - created_at))`,
      }
    );
    
    return result.affected || 0;
  }

  /**
   * End a specific session
   */
  async endSession(id: string): Promise<void> {
    await this.sessionRepository.update(id, {
      isActive: false,
      endedAt: new Date(),
      duration: () => `EXTRACT(EPOCH FROM (NOW() - created_at))`,
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: false })
      .where('expires_at < :now', { now: new Date() })
      .andWhere('isActive = :active', { active: true })
      .execute();
    return result.affected || 0;
  }

  /**
   * Helper method to convert hash to UUID format
   */
  private hashToUUID(hash: string): string {
    if (this.isUUID(hash)) return hash;
    
    // Use the first 32 characters of the hash to create a UUID
    const hashPart = hash.replace(/-/g, '').substring(0, 32).padEnd(32, '0');
    const segments = [
      hashPart.substring(0, 8),
      hashPart.substring(8, 12),
      hashPart.substring(12, 16),
      hashPart.substring(16, 20),
      hashPart.substring(20, 32),
    ];
    
    return segments.join('-');
  }

  /**
   * Check if a string is a valid UUID
   */
  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
