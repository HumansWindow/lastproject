import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ModuleUnlockService } from '../../../game/services/module-unlock.service';
import { GameModulesService } from '../../../game/services/game-modules.service';
import { GameNotificationService } from '../../../game/services/game-notification.service';
import { AppModule } from '../../../app.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { UnlockStatus } from '../../../game/interfaces/unlock-status.interface';

describe('Module Unlock Integration Tests', () => {
  let app: INestApplication;
  let moduleUnlockService: ModuleUnlockService;
  let gameModulesService: GameModulesService;
  let gameNotificationService: GameNotificationService;
  
  // Mock user for testing
  const testUser = { id: 'test-user-123', username: 'testuser', roles: ['user'] };
  
  // Mock modules
  const mockModules = [
    { 
      id: 'module-1', 
      title: 'Introduction Module', 
      order_index: 1,
      prerequisite_module_id: null,
      is_published: true,
      wait_time_hours: 0
    },
    { 
      id: 'module-2', 
      title: 'Intermediate Module', 
      order_index: 2,
      prerequisite_module_id: 'module-1',
      is_published: true,
      wait_time_hours: 24
    },
    { 
      id: 'module-3', 
      title: 'Advanced Module', 
      order_index: 3,
      prerequisite_module_id: 'module-2',
      is_published: true,
      wait_time_hours: 48
    }
  ];
  
  // Mock unlock schedules
  const mockUnlockSchedules = [
    {
      id: 'unlock-1',
      user_id: 'test-user-123',
      module_id: 'module-2',
      previous_module_id: 'module-1',
      unlock_date: new Date(Date.now() + 86400000), // 24 hours from now
      is_unlocked: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  beforeEach(async () => {
    // Create a testing module with mocked services
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = testUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    moduleUnlockService = moduleFixture.get<ModuleUnlockService>(ModuleUnlockService);
    gameModulesService = moduleFixture.get<GameModulesService>(GameModulesService);
    gameNotificationService = moduleFixture.get<GameNotificationService>(GameNotificationService);

    // Mock service methods
    jest.spyOn(moduleUnlockService, 'getUserModuleUnlocks').mockResolvedValue({
      unlocks: [
        {
          moduleId: 'module-2',
          moduleTitle: 'Intermediate Module',
          unlockDate: mockUnlockSchedules[0].unlock_date,
          isUnlocked: false,
          timeRemaining: {
            hours: 24,
            minutes: 0,
            seconds: 0
          }
        }
      ]
    });
    
    jest.spyOn(moduleUnlockService, 'checkModuleAccess').mockImplementation(
      async (userId, moduleId) => {
        if (moduleId === 'module-1') {
          return { canAccess: true };
        } else if (moduleId === 'module-2') {
          if (mockUnlockSchedules[0].is_unlocked) {
            return { canAccess: true };
          } else {
            return {
              canAccess: false,
              reason: 'WAITING_PERIOD',
              unlockDate: mockUnlockSchedules[0].unlock_date,
              timeRemaining: {
                hours: 24,
                minutes: 0,
                seconds: 0
              }
            };
          }
        } else if (moduleId === 'module-3') {
          return {
            canAccess: false,
            reason: 'PREREQUISITE_NOT_COMPLETED',
            prerequisiteModuleId: 'module-2'
          };
        }
        return { canAccess: false, reason: 'MODULE_NOT_FOUND' };
      }
    );
    
    jest.spyOn(moduleUnlockService, 'scheduleModuleUnlock').mockImplementation(
      async (userId, completedModuleId) => {
        if (completedModuleId === 'module-1') {
          return {
            hasNextModule: true,
            nextModuleId: 'module-2',
            nextModuleTitle: 'Intermediate Module',
            unlockDate: mockUnlockSchedules[0].unlock_date,
            waitTimeHours: 24
          };
        } else if (completedModuleId === 'module-2') {
          const unlockDate = new Date(Date.now() + 172800000); // 48 hours from now
          return {
            hasNextModule: true,
            nextModuleId: 'module-3',
            nextModuleTitle: 'Advanced Module',
            unlockDate: unlockDate,
            waitTimeHours: 48
          };
        }
        return { hasNextModule: false };
      }
    );
    
    jest.spyOn(moduleUnlockService, 'expediteModuleUnlock').mockImplementation(
      async (userId, moduleId) => {
        if (moduleId === 'module-2') {
          mockUnlockSchedules[0].is_unlocked = true;
          mockUnlockSchedules[0].unlock_date = new Date();
          
          return {
            success: true,
            moduleId: 'module-2',
            unlockedNow: true
          };
        }
        return {
          success: false,
          message: 'Payment failed or module not found'
        };
      }
    );
    
    jest.spyOn(moduleUnlockService, 'checkAndUpdateUserModules').mockImplementation(
      async (userId) => {
        // Simulate checking modules that are ready to unlock
        return {
          checked: 1,
          unlockedModules: []
        };
      }
    );
    
    jest.spyOn(gameNotificationService, 'sendImmediateUnlockNotification').mockResolvedValue(undefined);
    jest.spyOn(gameNotificationService, 'scheduleUnlockNotifications').mockResolvedValue(undefined);
    jest.spyOn(gameNotificationService, 'getUpcomingNotifications').mockResolvedValue({
      moduleId: 'module-2',
      notifications: [
        {
          id: 'notification-1',
          title: 'Module Unlocking Soon',
          scheduledFor: new Date(Date.now() + 86400000 - 3600000) // 1 hour before unlock
        }
      ]
    });
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  describe('Module Unlock Flow', () => {
    it('should retrieve upcoming module unlocks for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/game/unlocks')
        .expect(200);
      
      expect(response.body.unlocks).toHaveLength(1);
      expect(response.body.unlocks[0].moduleId).toBe('module-2');
      expect(moduleUnlockService.getUserModuleUnlocks).toHaveBeenCalledWith(testUser.id);
    });

    it('should check module access successfully for unlocked modules', async () => {
      const moduleId = 'module-1';
      
      const response = await request(app.getHttpServer())
        .get(`/game/unlocks/${moduleId}`)
        .expect(200);
      
      expect(response.body.canAccess).toBe(true);
      expect(moduleUnlockService.checkModuleAccess).toHaveBeenCalledWith(testUser.id, moduleId);
    });
    
    it('should return waiting period info for modules in waiting period', async () => {
      const moduleId = 'module-2';
      
      const response = await request(app.getHttpServer())
        .get(`/game/unlocks/${moduleId}`)
        .expect(200);
      
      expect(response.body.canAccess).toBe(false);
      expect(response.body.reason).toBe('WAITING_PERIOD');
      expect(response.body.timeRemaining).toBeDefined();
      expect(moduleUnlockService.checkModuleAccess).toHaveBeenCalledWith(testUser.id, moduleId);
    });
    
    it('should return prerequisite info for modules with incomplete prerequisites', async () => {
      const moduleId = 'module-3';
      
      const response = await request(app.getHttpServer())
        .get(`/game/unlocks/${moduleId}`)
        .expect(200);
      
      expect(response.body.canAccess).toBe(false);
      expect(response.body.reason).toBe('PREREQUISITE_NOT_COMPLETED');
      expect(response.body.prerequisiteModuleId).toBe('module-2');
      expect(moduleUnlockService.checkModuleAccess).toHaveBeenCalledWith(testUser.id, moduleId);
    });

    it('should schedule next module unlock when completing a module', async () => {
      const completedModuleId = 'module-1';
      
      // Mock method that would be called when module is completed
      const response = await request(app.getHttpServer())
        .post(`/game/progress/modules/${completedModuleId}/complete`)
        .expect(201);
      
      // Module completion is mocked, we're just testing that the unlock is scheduled
      expect(moduleUnlockService.scheduleModuleUnlock).toHaveBeenCalledWith(testUser.id, completedModuleId);
      expect(gameNotificationService.scheduleUnlockNotifications).toHaveBeenCalled();
    });

    it('should expedite unlock with payment', async () => {
      const moduleId = 'module-2';
      const paymentInfo = { tokenAmount: '100', tokenType: 'LEARN' };
      
      const response = await request(app.getHttpServer())
        .post(`/game/unlocks/${moduleId}/expedite`)
        .send(paymentInfo)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.unlockedNow).toBe(true);
      expect(moduleUnlockService.expediteModuleUnlock).toHaveBeenCalledWith(testUser.id, moduleId, paymentInfo);
      expect(gameNotificationService.sendImmediateUnlockNotification).toHaveBeenCalled();
    });

    it('should get upcoming notifications for module unlock', async () => {
      const moduleId = 'module-2';
      
      const response = await request(app.getHttpServer())
        .get(`/game/unlocks/notifications/${moduleId}`)
        .expect(200);
      
      expect(response.body.notifications).toHaveLength(1);
      expect(response.body.notifications[0].title).toBe('Module Unlocking Soon');
      expect(gameNotificationService.getUpcomingNotifications).toHaveBeenCalledWith(testUser.id, moduleId);
    });
    
    it('should check and update unlocks for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/game/unlocks/check-and-update')
        .expect(200);
      
      expect(response.body.checked).toBe(1);
      expect(moduleUnlockService.checkAndUpdateUserModules).toHaveBeenCalledWith(testUser.id);
    });
  });

  describe('Module Unlock Status Transitions', () => {
    it('should handle transition from waiting to unlocked', async () => {
      // Mock the unlock service to simulate a module becoming ready
      jest.spyOn(moduleUnlockService, 'checkAndUpdateUserModules').mockResolvedValueOnce({
        checked: 1,
        unlockedModules: [
          {
            moduleId: 'module-2',
            moduleTitle: 'Intermediate Module'
          }
        ]
      });
      
      const response = await request(app.getHttpServer())
        .get('/game/unlocks/check-and-update')
        .expect(200);
      
      expect(response.body.unlockedModules).toHaveLength(1);
      expect(response.body.unlockedModules[0].moduleId).toBe('module-2');
      expect(gameNotificationService.sendImmediateUnlockNotification).toHaveBeenCalled();
    });
    
    it('should handle module chaining with prerequisites', async () => {
      // Complete module-1, which will schedule module-2
      await request(app.getHttpServer())
        .post('/game/progress/modules/module-1/complete')
        .expect(201);
      
      expect(moduleUnlockService.scheduleModuleUnlock).toHaveBeenCalledWith(testUser.id, 'module-1');

      // Mock expedite for module-2
      await request(app.getHttpServer())
        .post('/game/unlocks/module-2/expedite')
        .send({ tokenAmount: '100', tokenType: 'LEARN' })
        .expect(201);

      // Complete module-2, which will schedule module-3
      await request(app.getHttpServer())
        .post('/game/progress/modules/module-2/complete')
        .expect(201);
      
      expect(moduleUnlockService.scheduleModuleUnlock).toHaveBeenCalledWith(testUser.id, 'module-2');
      
      // Verify module-3 is scheduled with 48 hour wait
      const scheduleCalls = jest.spyOn(moduleUnlockService, 'scheduleModuleUnlock').mock.calls;
      const schedulingCall = scheduleCalls.find(
        call => call[1] === 'module-2'
      );
      
      expect(schedulingCall).toBeDefined();
    });
  });
});