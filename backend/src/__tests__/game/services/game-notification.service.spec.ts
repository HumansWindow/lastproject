import { Test, TestingModule } from '@nestjs/testing';
import { GameNotificationService } from '../../../game/services/game-notification.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameNotificationTemplate } from '../../../game/entities/game-notification-template.entity';
import { ModuleNotificationSchedule } from '../../../game/entities/module-notification-schedule.entity';
import { UserNotification } from '../../../game/entities/user-notification.entity';
import { GameModule } from '../../../game/entities/game-module.entity';
import { NotFoundException } from '@nestjs/common';
import { NotificationType, TriggerType } from '../../../game/interfaces/notification-types.interface';
import { ConfigService } from '@nestjs/config';

describe('GameNotificationService', () => {
  let service: GameNotificationService;
  let notificationTemplateRepository: Repository<GameNotificationTemplate>;
  let notificationScheduleRepository: Repository<ModuleNotificationSchedule>;
  let userNotificationRepository: Repository<UserNotification>;
  let gameModuleRepository: Repository<GameModule>;
  let configService: ConfigService;

  // Mock data
  const userId = 'user1';
  const moduleId = 'module1';
  
  const mockModule = {
    id: 'module1',
    title: 'Introduction to Blockchain',
    description: 'Learn the basics of blockchain technology',
    orderIndex: 0,
    isActive: true
  };

  const mockTemplates = [
    {
      id: 'template1',
      moduleId: 'module1',
      title: 'Welcome to the Module',
      body: 'You have started the {module_title} module!',
      notificationType: 'module_start' as NotificationType,
      isActive: true,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01')
    },
    {
      id: 'template2',
      moduleId: 'module1',
      title: 'Module Unlocked',
      body: 'You have unlocked the {module_title} module!',
      notificationType: 'module_unlock' as NotificationType,
      isActive: true,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01')
    }
  ];

  const mockSchedules = [
    {
      id: 'schedule1',
      moduleId: 'module1',
      templateId: 'template1',
      triggerType: 'time_after_completion' as TriggerType,
      triggerHours: 24,
      triggerTime: null,
      isActive: true,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      template: mockTemplates[0],
      module: mockModule
    },
    {
      id: 'schedule2',
      moduleId: 'module1',
      templateId: 'template2',
      triggerType: 'specific_time' as TriggerType,
      triggerHours: null,
      triggerTime: '09:00',
      isActive: true,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      template: mockTemplates[1],
      module: mockModule
    }
  ];

  const mockNotifications = [
    {
      id: 'notification1',
      userId: 'user1',
      moduleId: 'module1',
      templateId: 'template1',
      scheduleId: 'schedule1',
      title: 'Welcome to the Module',
      body: 'You have started the Introduction to Blockchain module!',
      scheduledFor: new Date('2025-04-02'),
      sentAt: new Date('2025-04-02'),
      isRead: false,
      readAt: null,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      module: mockModule
    },
    {
      id: 'notification2',
      userId: 'user1',
      moduleId: 'module1',
      templateId: 'template2',
      scheduleId: 'schedule2',
      title: 'Module Unlocked',
      body: 'You have unlocked the Introduction to Blockchain module!',
      scheduledFor: new Date('2025-04-03'),
      sentAt: null,
      isRead: false,
      readAt: null,
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      module: mockModule
    }
  ];

  // Mock repositories
  const mockNotificationTemplateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  };

  const mockNotificationScheduleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  };

  // Create a proper query builder mock that can be verified
  const queryNotificationBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockNotifications)
  };

  const mockUserNotificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => queryNotificationBuilder)
  };

  const mockGameModuleRepository = {
    findOne: jest.fn(),
    count: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameNotificationService,
        {
          provide: getRepositoryToken(GameNotificationTemplate),
          useValue: mockNotificationTemplateRepository,
        },
        {
          provide: getRepositoryToken(ModuleNotificationSchedule),
          useValue: mockNotificationScheduleRepository,
        },
        {
          provide: getRepositoryToken(UserNotification),
          useValue: mockUserNotificationRepository,
        },
        {
          provide: getRepositoryToken(GameModule),
          useValue: mockGameModuleRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GameNotificationService>(GameNotificationService);
    notificationTemplateRepository = module.get<Repository<GameNotificationTemplate>>(
      getRepositoryToken(GameNotificationTemplate)
    );
    notificationScheduleRepository = module.get<Repository<ModuleNotificationSchedule>>(
      getRepositoryToken(ModuleNotificationSchedule)
    );
    userNotificationRepository = module.get<Repository<UserNotification>>(
      getRepositoryToken(UserNotification)
    );
    gameModuleRepository = module.get<Repository<GameModule>>(
      getRepositoryToken(GameModule)
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationTemplates', () => {
    it('should return templates for a module', async () => {
      // Setup
      mockNotificationTemplateRepository.find.mockResolvedValue(mockTemplates);

      // Execute
      const result = await service.getNotificationTemplates(moduleId);

      // Verify
      expect(result.length).toEqual(mockTemplates.length);
      expect(mockNotificationTemplateRepository.find).toHaveBeenCalledWith({
        where: { moduleId: moduleId },
        order: { createdAt: 'ASC' }
      });
    });
  });

  describe('getNotificationTemplate', () => {
    it('should return a template by ID', async () => {
      // Setup
      const templateId = 'template1';
      mockNotificationTemplateRepository.findOne.mockResolvedValue(mockTemplates[0]);

      // Execute
      const result = await service.getNotificationTemplate(templateId);

      // Verify
      expect(result.id).toEqual(templateId);
      expect(mockNotificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: templateId },
        relations: ['module']
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      // Setup
      const templateId = 'nonexistent';
      mockNotificationTemplateRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getNotificationTemplate(templateId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByType', () => {
    it('should return a template by type and module ID', async () => {
      // Setup
      const notificationType = 'module_unlock' as NotificationType;
      mockNotificationTemplateRepository.findOne.mockResolvedValue(mockTemplates[1]);

      // Execute
      const result = await service.findOneByType(moduleId, notificationType);

      // Verify
      expect(result.notificationType).toEqual(notificationType);
      expect(mockNotificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: {
          moduleId,
          notificationType,
          isActive: true
        }
      });
    });
  });

  describe('createTemplate', () => {
    it('should create a new notification template', async () => {
      // Setup
      const createDto = {
        moduleId,
        title: 'New Template',
        body: 'Template body',
        notificationType: 'achievement_earned' as NotificationType,
        isActive: true
      };

      mockGameModuleRepository.count.mockResolvedValue(1);
      mockNotificationTemplateRepository.create.mockReturnValue({
        ...createDto,
        id: 'new-template'
      });
      mockNotificationTemplateRepository.save.mockResolvedValue({
        ...createDto,
        id: 'new-template',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Execute
      const result = await service.createTemplate(createDto);

      // Verify
      expect(result.title).toEqual(createDto.title);
      expect(mockGameModuleRepository.count).toHaveBeenCalledWith({
        where: { id: moduleId }
      });
      expect(mockNotificationTemplateRepository.create).toHaveBeenCalled();
      expect(mockNotificationTemplateRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const createDto = {
        moduleId: 'nonexistent',
        title: 'New Template',
        body: 'Template body',
        notificationType: 'achievement_earned' as NotificationType
      };

      mockGameModuleRepository.count.mockResolvedValue(0);

      // Execute & Verify
      await expect(service.createTemplate(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      // Setup
      const templateId = 'template1';
      const updateDto = {
        title: 'Updated Title',
        isActive: false
      };

      mockNotificationTemplateRepository.findOne.mockResolvedValue({ 
        ...mockTemplates[0],
        updatedAt: new Date()
      });
      mockNotificationTemplateRepository.save.mockImplementation(entity => entity);

      // Execute
      const result = await service.updateTemplate(templateId, updateDto);

      // Verify
      expect(result.title).toEqual(updateDto.title);
      expect(result.isActive).toEqual(updateDto.isActive);
      expect(mockNotificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: templateId }
      });
      expect(mockNotificationTemplateRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when template not found', async () => {
      // Setup
      const templateId = 'nonexistent';
      mockNotificationTemplateRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.updateTemplate(templateId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete an existing template', async () => {
      // Setup
      const templateId = 'template1';
      mockNotificationTemplateRepository.findOne.mockResolvedValue(mockTemplates[0]);
      mockNotificationTemplateRepository.remove.mockResolvedValue(undefined);

      // Execute
      await service.deleteTemplate(templateId);

      // Verify
      expect(mockNotificationTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: templateId }
      });
      expect(mockNotificationTemplateRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when template not found', async () => {
      // Setup
      const templateId = 'nonexistent';
      mockNotificationTemplateRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.deleteTemplate(templateId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNotificationSchedules', () => {
    it('should return schedules for a module', async () => {
      // Setup
      mockNotificationScheduleRepository.find.mockResolvedValue(mockSchedules);

      // Execute
      const result = await service.getNotificationSchedules(moduleId);

      // Verify
      expect(result.length).toEqual(mockSchedules.length);
      expect(mockNotificationScheduleRepository.find).toHaveBeenCalledWith({
        where: { moduleId },
        relations: ['template'],
        order: { createdAt: 'ASC' }
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications for a user', async () => {
      // Setup
      mockUserNotificationRepository.findAndCount.mockResolvedValue([mockNotifications, mockNotifications.length]);
      mockUserNotificationRepository.count.mockResolvedValue(1);

      // Execute
      const result = await service.getUserNotifications(userId);

      // Verify
      expect(result.notifications.length).toEqual(mockNotifications.length);
      expect(result.totalCount).toEqual(mockNotifications.length);
      expect(mockUserNotificationRepository.findAndCount).toHaveBeenCalled();
      expect(mockUserNotificationRepository.count).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      // Setup
      const notificationId = 'notification1';
      const unreadNotification = { ...mockNotifications[0], isRead: false };
      
      mockUserNotificationRepository.findOne.mockResolvedValue(unreadNotification);
      mockUserNotificationRepository.save.mockImplementation(entity => ({
        ...entity,
        readAt: new Date()
      }));

      // Execute
      const result = await service.markAsRead(userId, notificationId);

      // Verify
      expect(result.read).toBe(true);
      expect(mockUserNotificationRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId
        },
        relations: ['module']
      });
      expect(mockUserNotificationRepository.save).toHaveBeenCalled();
    });

    it('should not update if notification is already read', async () => {
      // Setup
      const notificationId = 'notification1';
      const readNotification = { ...mockNotifications[0], isRead: true, readAt: new Date() };
      
      mockUserNotificationRepository.findOne.mockResolvedValue(readNotification);

      // Execute
      await service.markAsRead(userId, notificationId);

      // Verify
      expect(mockUserNotificationRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      // Setup
      const notificationId = 'nonexistent';
      mockUserNotificationRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.markAsRead(userId, notificationId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('scheduleUnlockNotifications', () => {
    it('should schedule notifications for module unlock', async () => {
      // Setup
      const unlockDate = new Date('2025-05-01');
      const waitTimeHours = 24;
      
      mockGameModuleRepository.findOne.mockResolvedValue(mockModule);
      mockNotificationScheduleRepository.find.mockResolvedValue([
        {
          ...mockSchedules[0],
          template: mockTemplates[0]
        }
      ]);
      mockUserNotificationRepository.create.mockReturnValue({
        id: 'new-notification',
        userId,
        moduleId,
        scheduledFor: expect.any(Date)
      });
      mockUserNotificationRepository.save.mockResolvedValue({});

      // Execute
      await service.scheduleUnlockNotifications(userId, moduleId, unlockDate, waitTimeHours);

      // Verify
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: moduleId }
      });
      expect(mockNotificationScheduleRepository.find).toHaveBeenCalledWith({
        where: {
          moduleId,
          isActive: true
        },
        relations: ['template']
      });
      expect(mockUserNotificationRepository.create).toHaveBeenCalled();
      expect(mockUserNotificationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const unlockDate = new Date('2025-05-01');
      const waitTimeHours = 24;
      
      mockGameModuleRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(
        service.scheduleUnlockNotifications(userId, 'nonexistent', unlockDate, waitTimeHours)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process due notifications', async () => {
      // Setup
      mockUserNotificationRepository.find.mockResolvedValue([mockNotifications[0]]);
      mockUserNotificationRepository.save.mockResolvedValue({});

      // Execute
      const result = await service.processScheduledNotifications();

      // Verify
      expect(result).toEqual(1);
      expect(mockUserNotificationRepository.find).toHaveBeenCalled();
      expect(mockUserNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sentAt: expect.any(Date)
        })
      );
    });

    it('should return 0 when no due notifications exist', async () => {
      // Setup
      mockUserNotificationRepository.find.mockResolvedValue([]);

      // Execute
      const result = await service.processScheduledNotifications();

      // Verify
      expect(result).toEqual(0);
      expect(mockUserNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getUpcomingNotifications', () => {
    it('should return upcoming notifications for a user', async () => {
      // Setup
      const queryBuilder = mockUserNotificationRepository.createQueryBuilder();
      queryBuilder.where.mockReturnValueOnce(queryBuilder);
      queryBuilder.andWhere.mockReturnValueOnce(queryBuilder);
      queryBuilder.getMany.mockResolvedValue(mockNotifications);

      // Execute
      const result = await service.getUpcomingNotifications(userId);

      // Verify
      expect(result.notifications.length).toEqual(mockNotifications.length);
      expect(queryBuilder.where).toHaveBeenCalledWith('notification.userId = :userId', { userId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('notification.sentAt IS NULL');
    });

    it('should filter by moduleId when provided', async () => {
      // Setup
      const queryBuilder = mockUserNotificationRepository.createQueryBuilder();
      queryBuilder.where.mockReturnValueOnce(queryBuilder);
      queryBuilder.andWhere.mockReturnValueOnce(queryBuilder);
      queryBuilder.andWhere.mockReturnValueOnce(queryBuilder);
      queryBuilder.getMany.mockResolvedValue(mockNotifications.filter(n => n.moduleId === moduleId));

      // Execute
      await service.getUpcomingNotifications(userId, moduleId);

      // Verify
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('notification.moduleId = :moduleId', { moduleId });
    });
  });
});