import { Injectable } from '@nestjs/common';
import { UserSession } from '../../users/entities/user-session.entity';

@Injectable()
export class UserSessionsServiceMock {
  async createSession(userId: string, deviceId: string, ip: string): Promise<UserSession> {
    return {
      id: 'mock-session-id',
      userId,
      deviceId,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      endedAt: null,
      ipAddress: ip,
      user: null,
      device: null,
      token: 'mock-session-token',
      isExpired: false,
      createdAt: new Date(),
    } as unknown as UserSession;
  }

  async endSession(_sessionId: string): Promise<void> {
    return;
  }

  async getUserActiveSessions(_userId: string): Promise<UserSession[]> {
    return [];
  }
}
