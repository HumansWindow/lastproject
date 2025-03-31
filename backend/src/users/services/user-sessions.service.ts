import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserSessionsService {
  private readonly logger = new Logger(UserSessionsService.name);

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  async createSession(data: {
    userId: string | number;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    token?: string;
    expiresAt?: Date; // Added expiresAt parameter
  }): Promise<UserSession> {
    try {
      // Convert deviceId to UUID format for consistency
      let deviceUuid = data.deviceId;
      if (data.deviceId && !this.isUUID(data.deviceId)) {
        // Convert hash to UUID for storage
        deviceUuid = this.hashToUUID(data.deviceId);
        this.logger.log(`Converting device ID to UUID: ${data.deviceId.substring(0, 8)}... -> ${deviceUuid}`);
      }

      // Remove user_agent if it's not in the database schema
      const sessionData: any = {
        userId: data.userId,
        deviceId: deviceUuid,
        ipAddress: data.ipAddress,
        token: data.token,
        expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry if not provided
      };

      // Create session without using userAgent field
      const session = this.sessionRepository.create(sessionData);
      
      try {
        // TypeORM can return either an array or a single entity depending on the input
        // We know we're saving a single entity, so we can safely use the first element if it's an array
        const savedSession = await this.sessionRepository.save(session);
        return Array.isArray(savedSession) ? savedSession[0] : savedSession;
      } catch (error) {
        // Check if error is related to user_agent column
        if (error.message && error.message.includes('user_agent')) {
          this.logger.warn('Database schema missing user_agent column. Creating session without it.');
          // Try again without the user_agent field
          delete sessionData.userAgent;
          const sessionWithoutAgent = this.sessionRepository.create(sessionData);
          const savedSession = await this.sessionRepository.save(sessionWithoutAgent);
          return Array.isArray(savedSession) ? savedSession[0] : savedSession;
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }

  async findByToken(token: string): Promise<UserSession | null> {
    const result = await this.sessionRepository.findOne({ where: { token } });
    return result || null;
  }

  async findByUserId(userId: string | number): Promise<UserSession[]> {
    return await this.sessionRepository.find({ 
      where: { userId: userId.toString() } 
    });
  }

  async endSession(id: string): Promise<void> {
    await this.sessionRepository.update(id, {
      isActive: false,
      endedAt: new Date(),
      duration: () => `EXTRACT(EPOCH FROM (NOW() - created_at))`,
    });
  }

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

  // Helper method to convert hash to UUID format
  private hashToUUID(hash: string): string {
    if (this.isUUID(hash)) return hash;
    
    // Use the first 32 characters of the hash to create a UUID
    const hashPart = hash.replace(/-/g, '').substring(0, 32);
    const segments = [
      hashPart.substring(0, 8),
      hashPart.substring(8, 12),
      hashPart.substring(12, 16),
      hashPart.substring(16, 20),
      hashPart.substring(20, 32),
    ];
    
    return segments.join('-');
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
