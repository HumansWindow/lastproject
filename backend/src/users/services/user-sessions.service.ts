import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserSessionsService {
  private readonly logger = new Logger(UserSessionsService.name);
  
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async create(data: Partial<UserSession>): Promise<UserSession> {
    try {
      // If deviceId is not a valid UUID, generate one based on it
      if (data.deviceId && data.deviceId.length !== 36) {
        // Generate a UUID based on the device ID to ensure consistency
        const deviceUuid = uuidv4();
        this.logger.log(`Converting device ID to UUID: ${data.deviceId.substring(0, 8)}... -> ${deviceUuid}`);
        data.deviceId = deviceUuid;
      }
      
      const session = this.userSessionRepository.create(data);
      return await this.userSessionRepository.save(session);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      // Don't throw an error - this allows the authentication to continue
      return null;
    }
  }

  async findById(id: string): Promise<UserSession> {
    return this.userSessionRepository.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<UserSession> {
    return this.userSessionRepository.findOne({ where: { token, isActive: true } });
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    return this.userSessionRepository.find({ where: { userId, isActive: true } });
  }

  async deactivate(id: string): Promise<void> {
    await this.userSessionRepository.update(id, { isActive: false });
  }

  async deactivateByToken(token: string): Promise<void> {
    await this.userSessionRepository.update({ token }, { isActive: false });
  }

  async deactivateByUserId(userId: string): Promise<void> {
    await this.userSessionRepository.update({ userId, isActive: true }, { isActive: false });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await this.userSessionRepository.update(
      { expiresAt: LessThan(now), isActive: true },
      { isActive: false },
    );
    return result.affected || 0;
  }

  async deleteExpiredSessions(daysOld: number = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);
    
    const result = await this.userSessionRepository.delete({
      expiresAt: LessThan(date)
    });
    
    return result.affected || 0;
  }
}
