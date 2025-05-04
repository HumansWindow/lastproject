import { Test, TestingModule } from '@nestjs/testing';
import { ModuleUnlockService } from '../../../game/services/module-unlock.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModuleUnlockSchedule } from '../../../game/entities/module-unlock-schedule.entity';
import { SectionUnlockSchedule } from '../../../game/entities/section-unlock-schedule.entity';
import { GameModule } from '../../../game/entities/game-module.entity';
import { GameSection } from '../../../game/entities/game-section.entity';
import { UserProgress } from '../../../game/entities/user-progress.entity';
import { ConfigService } from '@nestjs/config';
import { GameNotificationService } from '../../../game/services/game-notification.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ModuleUnlockService', () => {
  let service: ModuleUnlockService;
  let moduleUnlockRepository: Repository<ModuleUnlockSchedule>;
  let sectionUnlockRepository: Repository<SectionUnlockSchedule>;
  let gameModuleRepository: Repository<GameModule>;
  let gameSectionRepository: Repository<GameSection>;
  let userProgressRepository: Repository<UserProgress>;
  let configService: ConfigService;
  let notificationService: GameNotificationService;

  // Mock data
  const userId = 'user1';
  
  const mockModules = [
    {
      id: 'module1',
      title: 'Introduction to Blockchain',
      description: 'Learn the basics of blockchain technology',
      orderIndex: 0,
      prerequisiteModuleId: null,
      waitTimeHours: 0,
      isActive: true
    },
    {
      id: 'module2',
      title: 'Cryptocurrencies 101',
      description: 'Introduction to cryptocurrencies',
      orderIndex: 1,
      prerequisiteModuleId: 'module1',
      waitTimeHours: 24,
      isActive: true
    },
    {
      id: 'module3',
      title: 'Smart Contracts',
      description: 'Learn about smart contracts',
      orderIndex: 2,
      prerequisiteModuleId: 'module2',
      waitTimeHours: 48,
      isActive: true
    }
  ];

  const mockSections = [
    {
      id: 'section1',
      moduleId: 'module1',
      title: 'What is Blockchain',
      description: 'Basic concepts of blockchain',
      orderIndex: 0,
      waitTimeHours: 0,
      isActive: true
    },
    {
      id: 'section2',
      moduleId: 'module1',
      title: 'Blockchain History',
      description: 'History of blockchain technology',
      orderIndex: 1,
      waitTimeHours: 1,
      isActive: true
    },
    {
      id: 'section3',
      moduleId: 'module2',
      title: 'Bitcoin Introduction',
      description: 'Introduction to Bitcoin',
      orderIndex: 0,
      waitTimeHours: 0,
      isActive: true
    }
  ];

  const mockUnlockSchedules = [
    {
      id: 'unlock1',
      userId: 'user1',
      moduleId: 'module2',
      previousModuleId: 'module1',
      unlockDate: new Date(Date.now() + 24 * 3600 * 1000), // 24 hours from now
      isUnlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      module: mockModules[1],
      previousModule: mockModules[0]
    },
    {
      id: 'unlock2',
      userId: 'user1',
      moduleId: 'module3',
      previousModuleId: 'module2',
      unlockDate: new Date(Date.now() - 1 * 3600 * 1000), // 1 hour ago
      isUnlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      module: mockModules[2],
      previousModule: mockModules[1]
    }
  ];

  const mockSectionUnlocks = [
    {
      id: 'section-unlock1',
      userId: 'user1',
      moduleId: 'module1',
      sectionId: 'section2',
      previousSectionId: 'section1',
      unlockDate: new Date(Date.now() + 1 * 3600 * 1000), // 1 hour from now
      isUnlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      section: mockSections[1],
      module: mockModules[0],
      previousSection: mockSections[0]
    }
  ];

  const mockProgress = [
    {
      id: 'progress1',
      userId: 'user1',
      moduleId: 'module1',
      sectionId: null,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'progress2',
      userId: 'user1',
      moduleId: 'module1',
      sectionId: 'section1',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Mock repositories and services
  const mockModuleUnlockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn()
    }))
  };

  // Create a proper query builder mock that can be verified
  const querySectionBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockSectionUnlocks)
  };

  const mockSectionUnlockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => querySectionBuilder)
  };

  const mockGameModuleRepository = {
    findOne: jest.fn(),
    find: jest.fn()
  };

  const mockGameSectionRepository = {
    findOne: jest.fn()
  };

  const mockUserProgressRepository = {
    findOne: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn()
  };

  const mockNotificationService = {
    scheduleUnlockNotifications: jest.fn().mockResolvedValue(undefined),
    sendImmediateUnlockNotification: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleUnlockService,
        {
          provide: getRepositoryToken(ModuleUnlockSchedule),
          useValue: mockModuleUnlockRepository,
        },
        {
          provide: getRepositoryToken(SectionUnlockSchedule),
          useValue: mockSectionUnlockRepository,
        },
        {
          provide: getRepositoryToken(GameModule),
          useValue: mockGameModuleRepository,
        },
        {
          provide: getRepositoryToken(GameSection),
          useValue: mockGameSectionRepository,
        },
        {
          provide: getRepositoryToken(UserProgress),
          useValue: mockUserProgressRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: GameNotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ModuleUnlockService>(ModuleUnlockService);
    moduleUnlockRepository = module.get<Repository<ModuleUnlockSchedule>>(getRepositoryToken(ModuleUnlockSchedule));
    sectionUnlockRepository = module.get<Repository<SectionUnlockSchedule>>(getRepositoryToken(SectionUnlockSchedule));
    gameModuleRepository = module.get<Repository<GameModule>>(getRepositoryToken(GameModule));
    gameSectionRepository = module.get<Repository<GameSection>>(getRepositoryToken(GameSection));
    userProgressRepository = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
    configService = module.get<ConfigService>(ConfigService);
    notificationService = module.get<GameNotificationService>(GameNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleModuleUnlock', () => {
    it('should schedule next module unlock when completing a module', async () => {
      // Setup
      const completedModuleId = 'module1';
      mockGameModuleRepository.findOne.mockImplementation((args) => {
        if (args.where.id === 'module1') return mockModules[0];
        return null;
      });
      mockGameModuleRepository.find.mockResolvedValue([mockModules[1]]);
      mockModuleUnlockRepository.findOne.mockResolvedValue(null);
      mockModuleUnlockRepository.create.mockReturnValue({
        userId,
        moduleId: 'module2',
        previousModuleId: 'module1',
        unlockDate: expect.any(Date),
        isUnlocked: false
      });
      mockModuleUnlockRepository.save.mockImplementation(entity => entity);

      // Execute
      const result = await service.scheduleModuleUnlock(userId, completedModuleId);

      // Verify
      expect(result.hasNextModule).toBe(true);
      expect(result.nextModuleId).toBe('module2');
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: completedModuleId }
      });
      expect(mockGameModuleRepository.find).toHaveBeenCalled();
      expect(mockModuleUnlockRepository.create).toHaveBeenCalled();
      expect(mockModuleUnlockRepository.save).toHaveBeenCalled();
      expect(mockNotificationService.scheduleUnlockNotifications).toHaveBeenCalled();
    });

    it('should update existing unlock schedule if one exists', async () => {
      // Setup
      const completedModuleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      mockGameModuleRepository.find.mockResolvedValue([mockModules[1]]);
      const existingSchedule = { ...mockUnlockSchedules[0], save: jest.fn() };
      mockModuleUnlockRepository.findOne.mockResolvedValue(existingSchedule);

      // Execute
      const result = await service.scheduleModuleUnlock(userId, completedModuleId);

      // Verify
      expect(result.hasNextModule).toBe(true);
      expect(result.nextModuleId).toBe('module2');
      expect(mockModuleUnlockRepository.save).toHaveBeenCalled();
    });

    it('should return hasNextModule: false when no next module exists', async () => {
      // Setup
      const completedModuleId = 'module3'; // Last module
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[2]);
      mockGameModuleRepository.find.mockResolvedValue([]);

      // Mock findNextModule to return null (no next module)
      jest.spyOn(service as any, 'findNextModule').mockResolvedValue(null);

      // Execute
      const result = await service.scheduleModuleUnlock(userId, completedModuleId);

      // Verify
      expect(result.hasNextModule).toBe(false);
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const nonExistentModuleId = 'nonexistent';
      mockGameModuleRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.scheduleModuleUnlock(userId, nonExistentModuleId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('scheduleSectionUnlock', () => {
    it('should schedule next section unlock when completing a section', async () => {
      // Setup
      const completedSectionId = 'section1';
      mockGameSectionRepository.findOne.mockImplementation((args) => {
        if (args.where.id === 'section1') return mockSections[0];
        if (args.where.moduleId === 'module1' && args.where.orderIndex === 1) return mockSections[1];
        return null;
      });
      mockSectionUnlockRepository.findOne.mockResolvedValue(null);
      mockSectionUnlockRepository.create.mockReturnValue({
        userId,
        sectionId: 'section2',
        moduleId: 'module1',
        previousSectionId: 'section1',
        unlockDate: expect.any(Date),
        isUnlocked: false
      });
      mockSectionUnlockRepository.save.mockImplementation(entity => entity);

      // Execute
      const result = await service.scheduleSectionUnlock(userId, completedSectionId);

      // Verify
      expect(result.hasNextSection).toBe(true);
      expect(result.nextSectionId).toBe('section2');
      expect(mockGameSectionRepository.findOne).toHaveBeenCalledWith({
        where: { id: completedSectionId }
      });
      expect(mockSectionUnlockRepository.create).toHaveBeenCalled();
      expect(mockSectionUnlockRepository.save).toHaveBeenCalled();
    });

    it('should return hasNextSection: false when no next section exists', async () => {
      // Setup
      const completedSectionId = 'section2'; // Last section in module
      mockGameSectionRepository.findOne.mockImplementation((args) => {
        if (args.where.id === 'section2') return mockSections[1];
        return null;
      });

      // Execute
      const result = await service.scheduleSectionUnlock(userId, completedSectionId);

      // Verify
      expect(result.hasNextSection).toBe(false);
    });
  });

  describe('getUserModuleUnlocks', () => {
    it('should return user module unlocks', async () => {
      // Setup
      mockModuleUnlockRepository.find.mockResolvedValue(mockUnlockSchedules);

      // Execute
      const result = await service.getUserModuleUnlocks(userId);

      // Verify
      expect(result.unlocks.length).toEqual(mockUnlockSchedules.length);
      expect(mockModuleUnlockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['module', 'previousModule'],
        order: { unlockDate: 'ASC' }
      });
    });
  });

  describe('getUserSectionUnlocks', () => {
    it('should return user section unlocks', async () => {
      // Setup
      const queryBuilder = mockSectionUnlockRepository.createQueryBuilder();
      queryBuilder.where.mockReturnValueOnce(queryBuilder);
      queryBuilder.getMany.mockResolvedValue(mockSectionUnlocks);

      // Execute
      const result = await service.getUserSectionUnlocks(userId);

      // Verify
      expect(result.unlocks.length).toEqual(mockSectionUnlocks.length);
      expect(queryBuilder.where).toHaveBeenCalledWith('unlock.userId = :userId', { userId });
    });

    it('should filter by moduleId when provided', async () => {
      // Setup
      const moduleId = 'module1';
      const queryBuilder = mockSectionUnlockRepository.createQueryBuilder();
      queryBuilder.where.mockReturnValueOnce(queryBuilder);
      queryBuilder.andWhere.mockReturnValueOnce(queryBuilder);
      queryBuilder.getMany.mockResolvedValue(mockSectionUnlocks.filter(u => u.moduleId === moduleId));

      // Execute
      await service.getUserSectionUnlocks(userId, moduleId);

      // Verify
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('unlock.moduleId = :moduleId', { moduleId });
    });
  });

  describe('checkModuleAccess', () => {
    it('should grant access to a module with no prerequisites', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);

      // Execute
      const result = await service.checkModuleAccess(userId, moduleId);

      // Verify
      expect(result.canAccess).toBe(true);
    });

    it('should deny access when prerequisite not completed', async () => {
      // Setup
      const moduleId = 'module2';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      jest.spyOn(service as any, 'isModuleCompleted').mockResolvedValue(false);

      // Execute
      const result = await service.checkModuleAccess(userId, moduleId);

      // Verify
      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('PREREQUISITE_NOT_COMPLETED');
    });

    it('should deny access during waiting period', async () => {
      // Setup
      const moduleId = 'module2';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      jest.spyOn(service as any, 'isModuleCompleted').mockResolvedValue(true);
      mockModuleUnlockRepository.findOne.mockResolvedValue({
        ...mockUnlockSchedules[0],
        unlockDate: new Date(Date.now() + 1000 * 60 * 60) // 1 hour in future
      });

      // Execute
      const result = await service.checkModuleAccess(userId, moduleId);

      // Verify
      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('WAITING_PERIOD');
      expect(result.timeRemaining).toBeDefined();
    });

    it('should auto-unlock module when waiting period has passed', async () => {
      // Setup
      const moduleId = 'module3';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[2]);
      jest.spyOn(service as any, 'isModuleCompleted').mockResolvedValue(true);
      const unlockSchedule = { 
        ...mockUnlockSchedules[1], 
        unlockDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour in past
        isUnlocked: false 
      };
      mockModuleUnlockRepository.findOne.mockResolvedValue(unlockSchedule);
      mockModuleUnlockRepository.save.mockResolvedValue({ ...unlockSchedule, isUnlocked: true });

      // Execute
      const result = await service.checkModuleAccess(userId, moduleId);

      // Verify
      expect(result.canAccess).toBe(true);
      expect(mockModuleUnlockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isUnlocked: true
        })
      );
    });
  });

  describe('checkSectionAccess', () => {
    it('should grant access to first section in module', async () => {
      // Setup
      const sectionId = 'section1';
      mockGameSectionRepository.findOne.mockResolvedValue(mockSections[0]);
      jest.spyOn(service, 'checkModuleAccess').mockResolvedValue({ canAccess: true });
      jest.spyOn(service as any, 'findPreviousSectionInModule').mockResolvedValue(null);

      // Execute
      const result = await service.checkSectionAccess(userId, sectionId);

      // Verify
      expect(result.canAccess).toBe(true);
    });

    it('should deny access when module access is denied', async () => {
      // Setup
      const sectionId = 'section1';
      mockGameSectionRepository.findOne.mockResolvedValue(mockSections[0]);
      jest.spyOn(service, 'checkModuleAccess').mockResolvedValue({ 
        canAccess: false,
        reason: 'MODULE_INACTIVE' 
      });

      // Execute
      const result = await service.checkSectionAccess(userId, sectionId);

      // Verify
      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('MODULE_INACTIVE');
    });

    it('should deny access when previous section not completed', async () => {
      // Setup
      const sectionId = 'section2';
      mockGameSectionRepository.findOne.mockResolvedValue(mockSections[1]);
      jest.spyOn(service, 'checkModuleAccess').mockResolvedValue({ canAccess: true });
      jest.spyOn(service as any, 'findPreviousSectionInModule').mockResolvedValue(mockSections[0]);
      jest.spyOn(service as any, 'isSectionCompleted').mockResolvedValue(false);

      // Execute
      const result = await service.checkSectionAccess(userId, sectionId);

      // Verify
      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('PREVIOUS_SECTION_NOT_COMPLETED');
    });
  });

  describe('expediteModuleUnlock', () => {
    it('should expedite module unlock', async () => {
      // Setup
      const moduleId = 'module2';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      const unlockSchedule = { 
        ...mockUnlockSchedules[0],
        isUnlocked: false,
        save: jest.fn()
      };
      mockModuleUnlockRepository.findOne.mockResolvedValue(unlockSchedule);
      mockModuleUnlockRepository.save.mockResolvedValue({ ...unlockSchedule, isUnlocked: true });
      jest.spyOn(service as any, 'calculateTimeRemaining').mockReturnValue({ 
        hours: 10, minutes: 30, seconds: 15 
      });

      // Execute
      const result = await service.expediteModuleUnlock(userId, moduleId);

      // Verify
      expect(result.success).toBe(true);
      expect(result.alreadyUnlocked).toBe(false);
      expect(result.timeSkipped).toBeDefined();
      expect(mockModuleUnlockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isUnlocked: true
        })
      );
      expect(mockNotificationService.sendImmediateUnlockNotification).toHaveBeenCalledWith(
        userId, moduleId, 'expedited'
      );
    });

    it('should return success with alreadyUnlocked true when module already unlocked', async () => {
      // Setup
      const moduleId = 'module2';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      mockModuleUnlockRepository.findOne.mockResolvedValue({ 
        ...mockUnlockSchedules[0],
        isUnlocked: true
      });

      // Execute
      const result = await service.expediteModuleUnlock(userId, moduleId);

      // Verify
      expect(result.success).toBe(true);
      expect(result.alreadyUnlocked).toBe(true);
      expect(mockModuleUnlockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no unlock schedule exists', async () => {
      // Setup
      const moduleId = 'module2';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      mockModuleUnlockRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.expediteModuleUnlock(userId, moduleId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('checkAndUpdateUserModules', () => {
    it('should update modules and sections with passed unlock dates', async () => {
      // Setup
      const moduleSchedule = { 
        ...mockUnlockSchedules[1],
        isUnlocked: false 
      };
      mockModuleUnlockRepository.find.mockResolvedValue([moduleSchedule]);
      mockSectionUnlockRepository.find.mockResolvedValue([{
        ...mockSectionUnlocks[0],
        unlockDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        isUnlocked: false
      }]);
      mockModuleUnlockRepository.save.mockImplementation(entity => entity);
      mockSectionUnlockRepository.save.mockImplementation(entity => entity);

      // Execute
      const result = await service.checkAndUpdateUserModules(userId);

      // Verify
      expect(result.unlockedModules.length).toBe(1);
      expect(result.unlockedSections.length).toBe(1);
      expect(mockModuleUnlockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isUnlocked: true
        })
      );
      expect(mockSectionUnlockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isUnlocked: true
        })
      );
    });

    it('should return empty arrays when no modules or sections need unlocking', async () => {
      // Setup
      mockModuleUnlockRepository.find.mockResolvedValue([]);
      mockSectionUnlockRepository.find.mockResolvedValue([]);

      // Execute
      const result = await service.checkAndUpdateUserModules(userId);

      // Verify
      expect(result.unlockedModules.length).toBe(0);
      expect(result.unlockedSections.length).toBe(0);
      expect(result.checkedModules).toBe(0);
    });
  });
});