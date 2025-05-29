import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../../users/entities/user-session.entity';
import { User } from '../../users/entities/user.entity';
import { UserDevice } from '../../users/entities/user-device.entity';
import { UserSessionsService } from '../../users/services/user-sessions.service';
import { DeviceDetectorService } from '../../shared/services/device-detector.service';
import { UserDevicesService } from '../../users/services/user-devices.service';
import { v4 as uuidv4 } from 'uuid';

describe('Session Management Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userSessionService: UserSessionsService;
  let userDeviceService: UserDevicesService;
  let userSessionRepo: Repository<UserSession>;
  let userRepo: Repository<User>;
  let userDeviceRepo: Repository<UserDevice>;
  let deviceDetectorService: DeviceDetectorService;

  beforeAll(async () => {
    // Create testing module with real services but mocked repositories
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get services
    jwtService = moduleRef.get<JwtService>(JwtService);
    userSessionService = moduleRef.get<UserSessionsService>(UserSessionsService);
    userDeviceService = moduleRef.get<UserDevicesService>(UserDevicesService);
    deviceDetectorService = moduleRef.get<DeviceDetectorService>(DeviceDetectorService);
    
    // Get repositories
    userSessionRepo = moduleRef.get<Repository<UserSession>>(getRepositoryToken(UserSession));
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    userDeviceRepo = moduleRef.get<Repository<UserDevice>>(getRepositoryToken(UserDevice));
  });

  afterAll(async () => {
    await app.close();
  });

  let testUser: User;
  let testDevice: UserDevice;
  let testSession: UserSession;

  beforeEach(async () => {
    // Create a test user
    testUser = new User();
    testUser.id = uuidv4();
    testUser.email = `test-${Date.now()}@example.com`;
    testUser.password = 'hashedpassword';
    testUser.createdAt = new Date();
    await userRepo.save(testUser);

    // Create test device for the user
    testDevice = new UserDevice();
    testDevice.id = uuidv4();
    testDevice.userId = testUser.id;
    testDevice.deviceId = 'test-device-id';
    testDevice.browser = 'Chrome';
    testDevice.os = 'Windows';
    testDevice.platform = 'Desktop';
    testDevice.lastIpAddress = '127.0.0.1';
    testDevice.visitCount = 1;
    testDevice.firstSeen = new Date();
    testDevice.lastSeen = new Date();
    await userDeviceRepo.save(testDevice);
  });

  afterEach(async () => {
    // Cleanup after each test
    await userSessionRepo.delete({ userId: testUser.id });
    await userDeviceRepo.delete({ userId: testUser.id });
    await userRepo.delete({ id: testUser.id });
  });

  describe('Session Creation and Management', () => {
    it('should create a new session', async () => {
      // Create a session using the service
      const session = await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.deviceId).toBe(testDevice.id);
      expect(session.ipAddress).toBe('127.0.0.1');
      expect(session.isActive).toBe(true);
    });

    it('should find active sessions by user ID', async () => {
      // Create a session
      await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      // Find active sessions
      const sessions = await userSessionService.findActiveSessionsByUserId(testUser.id);
      
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].userId).toBe(testUser.id);
      expect(sessions[0].isActive).toBe(true);
    });

    it('should end session', async () => {
      // Create a session
      const session = await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      // End session
      await userSessionService.endSession(session.id);
      
      // Check if session is ended
      const updatedSession = await userSessionRepo.findOne({ where: { id: session.id } });
      
      expect(updatedSession).toBeDefined();
      expect(updatedSession.isActive).toBe(false);
      expect(updatedSession.endedAt).toBeDefined();
    });

    it('should end all sessions for a user', async () => {
      // Create multiple sessions for the same user
      await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      // End all sessions
      await userSessionService.endAllSessionsForUser(testUser.id);
      
      // Check if all sessions are ended
      const activeSessions = await userSessionRepo.find({
        where: {
          userId: testUser.id,
          isActive: true,
        },
      });
      
      expect(activeSessions.length).toBe(0);
    });
  });

  describe('Session Expiration', () => {
    it('should identify and clean up expired sessions', async () => {
      // Create a session
      const session = await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      // Manually expire the session by modifying its expiry date
      const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      await userSessionRepo.update(session.id, {
        createdAt: TWO_DAYS_AGO,
        expiresAt: TWO_DAYS_AGO, // Use expiresAt instead of lastActivityAt
      });

      // Clean up expired sessions (assumes default expiry is 1 day)
      await userSessionService.cleanupExpiredSessions();

      // Check if session is now inactive
      const updatedSession = await userSessionRepo.findOne({ where: { id: session.id } });
      expect(updatedSession.isActive).toBe(false);
    });
  });

  describe('One-Device-One-Wallet Policy', () => {
    it('should prevent using the same wallet on different devices', async () => {
      // Create a second device
      const secondDevice = new UserDevice();
      secondDevice.id = uuidv4();
      secondDevice.userId = testUser.id;
      secondDevice.deviceId = 'different-device-id';
      secondDevice.browser = 'Firefox';
      secondDevice.os = 'Mac OS';
      secondDevice.platform = 'Desktop';
      secondDevice.lastIpAddress = '192.168.1.1';
      secondDevice.visitCount = 1;
      secondDevice.firstSeen = new Date();
      secondDevice.lastSeen = new Date();
      await userDeviceRepo.save(secondDevice);

      // Register a wallet with the first device
      const walletAddress = '0x1234567890123456789012345678901234567890';
      await userDeviceService.addWalletToDevice(testDevice.id, walletAddress);

      // Try to register the same wallet with the second device
      try {
        await userDeviceService.addWalletToDevice(secondDevice.id, walletAddress);
        fail('Should have thrown an error for device-wallet policy violation');
      } catch (error) {
        expect(error.message).toContain('wallet is already associated');
      }

      // Clean up
      await userDeviceRepo.delete({ id: secondDevice.id });
    });

    it('should allow registering different wallets on different devices', async () => {
      // Create a second device
      const secondDevice = new UserDevice();
      secondDevice.id = uuidv4();
      secondDevice.userId = testUser.id;
      secondDevice.deviceId = 'different-device-id';
      secondDevice.browser = 'Firefox';
      secondDevice.os = 'Mac OS';
      secondDevice.platform = 'Desktop';
      secondDevice.lastIpAddress = '192.168.1.1';
      secondDevice.visitCount = 1;
      secondDevice.firstSeen = new Date();
      secondDevice.lastSeen = new Date();
      await userDeviceRepo.save(secondDevice);

      // Register a wallet with the first device
      const walletAddress1 = '0x1234567890123456789012345678901234567890';
      await userDeviceService.addWalletToDevice(testDevice.id, walletAddress1);

      // Register a different wallet with the second device
      const walletAddress2 = '0x0987654321098765432109876543210987654321';
      const result = await userDeviceService.addWalletToDevice(secondDevice.id, walletAddress2);
      
      expect(result).toBe(true);

      // Clean up
      await userDeviceRepo.delete({ id: secondDevice.id });
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle concurrent user sessions across devices', async () => {
      // Create a second device
      const secondDevice = new UserDevice();
      secondDevice.id = uuidv4();
      secondDevice.userId = testUser.id;
      secondDevice.deviceId = 'different-device-id';
      secondDevice.browser = 'Firefox';
      secondDevice.os = 'Mac OS';
      secondDevice.platform = 'Desktop';
      secondDevice.lastIpAddress = '192.168.1.1';
      secondDevice.visitCount = 1;
      secondDevice.firstSeen = new Date();
      secondDevice.lastSeen = new Date();
      await userDeviceRepo.save(secondDevice);

      // Create sessions on both devices
      const session1 = await userSessionService.createSession({
        userId: testUser.id,
        deviceId: testDevice.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      const session2 = await userSessionService.createSession({
        userId: testUser.id,
        deviceId: secondDevice.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      // Get active sessions
      const activeSessions = await userSessionService.findActiveSessionsByUserId(testUser.id);
      
      expect(activeSessions.length).toBe(2);
      
      // End one specific session
      await userSessionService.endSession(session1.id);
      
      // Verify one session remains active
      const remainingSessions = await userSessionService.findActiveSessionsByUserId(testUser.id);
      expect(remainingSessions.length).toBe(1);
      expect(remainingSessions[0].id).toBe(session2.id);

      // Clean up
      await userDeviceRepo.delete({ id: secondDevice.id });
    });
  });
});