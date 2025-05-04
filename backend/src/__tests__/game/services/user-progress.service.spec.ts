import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressService } from '../../../game/services/user-progress.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProgress } from '../../../game/entities/user-progress.entity';
import { GameModule } from '../../../game/entities/game-module.entity';
import { GameSection } from '../../../game/entities/game-section.entity';
import { SectionCheckpoint } from '../../../game/entities/section-checkpoint.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProgressStatus } from '../../../game/interfaces/progress-status.interface';
import { UpdateUserProgressDto, CheckpointCompletionDto } from '../../../game/dto/progress.dto';

describe('UserProgressService', () => {
  let service: UserProgressService;
  let userProgressRepository: Repository<UserProgress>;
  let gameModuleRepository: Repository<GameModule>;
  let gameSectionRepository: Repository<GameSection>;
  let checkpointRepository: Repository<SectionCheckpoint>;

  // Mock data
  const userId = 'user1';
  
  const mockModules = [
    {
      id: 'module1',
      title: 'Introduction Module',
      description: 'Get started with the basics',
      orderIndex: 0,
      prerequisiteModuleId: null,
      isActive: true,
      sections: [
        {
          id: 'section1-1',
          moduleId: 'module1',
          title: 'Welcome Section',
          sectionType: 'text-image',
          orderIndex: 0,
          isActive: true
        },
        {
          id: 'section1-2',
          moduleId: 'module1',
          title: 'Basic Concepts',
          sectionType: 'text-image',
          orderIndex: 1,
          isActive: true
        }
      ]
    },
    {
      id: 'module2',
      title: 'Advanced Module',
      description: 'Advanced concepts',
      orderIndex: 1,
      prerequisiteModuleId: 'module1',
      isActive: true,
      sections: [
        {
          id: 'section2-1',
          moduleId: 'module2',
          title: 'Advanced Section 1',
          sectionType: 'text-image',
          orderIndex: 0,
          isActive: true
        }
      ]
    }
  ];

  const mockSections = [
    ...mockModules[0].sections,
    ...mockModules[1].sections
  ];

  const mockProgress = [
    {
      id: 'progress1',
      userId: 'user1',
      moduleId: 'module1',
      sectionId: null,
      status: ProgressStatus.IN_PROGRESS,
      startedAt: new Date('2025-04-01'),
      completedAt: null,
      updatedAt: new Date('2025-04-01'),
      createdAt: new Date('2025-04-01'),
      section: null,
      rewardClaimed: false,
      rewardClaimDate: null
    },
    {
      id: 'progress2',
      userId: 'user1',
      moduleId: 'module1',
      sectionId: 'section1-1',
      status: ProgressStatus.COMPLETED,
      startedAt: new Date('2025-04-01'),
      completedAt: new Date('2025-04-02'),
      updatedAt: new Date('2025-04-02'),
      createdAt: new Date('2025-04-01'),
      section: mockModules[0].sections[0],
      rewardClaimed: false,
      rewardClaimDate: null
    }
  ];

  const mockCheckpoints = [
    {
      id: 'checkpoint1',
      progressId: 'progress2',
      checkpointType: 'content',
      completedAt: new Date('2025-04-02'),
      responses: { answered: true },
      timeSpent: 120
    }
  ];

  // Mock repositories
  const mockUserProgressRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn()
  };

  const mockGameModuleRepository = {
    find: jest.fn(),
    findOne: jest.fn()
  };

  const mockGameSectionRepository = {
    find: jest.fn(),
    findOne: jest.fn()
  };

  const mockCheckpointRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProgressService,
        {
          provide: getRepositoryToken(UserProgress),
          useValue: mockUserProgressRepository,
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
          provide: getRepositoryToken(SectionCheckpoint),
          useValue: mockCheckpointRepository,
        },
      ],
    }).compile();

    service = module.get<UserProgressService>(UserProgressService);
    userProgressRepository = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
    gameModuleRepository = module.get<Repository<GameModule>>(getRepositoryToken(GameModule));
    gameSectionRepository = module.get<Repository<GameSection>>(getRepositoryToken(GameSection));
    checkpointRepository = module.get<Repository<SectionCheckpoint>>(getRepositoryToken(SectionCheckpoint));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProgressSummary', () => {
    it('should return progress summary for a user', async () => {
      // Setup
      mockGameModuleRepository.find.mockResolvedValue(mockModules);
      mockUserProgressRepository.find.mockResolvedValue(mockProgress);

      // Execute
      const result = await service.getUserProgressSummary(userId);

      // Verify
      expect(result.userId).toEqual(userId);
      expect(result.modules.length).toEqual(mockModules.length);
      expect(mockGameModuleRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { orderIndex: 'ASC' },
        relations: ['sections']
      });
      expect(mockUserProgressRepository.find).toHaveBeenCalledWith({
        where: { userId: userId },
        relations: ['section']
      });
    });
  });

  describe('getModuleProgress', () => {
    it('should return detailed progress for a module', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      mockUserProgressRepository.findOne.mockResolvedValue(mockProgress[0]);
      mockUserProgressRepository.find.mockResolvedValue([mockProgress[1]]);
      mockCheckpointRepository.find.mockResolvedValue(mockCheckpoints);

      // Execute
      const result = await service.getModuleProgress(userId, moduleId);

      // Verify
      expect(result.moduleId).toEqual(moduleId);
      expect(result.moduleTitle).toEqual(mockModules[0].title);
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: moduleId },
        relations: ['sections']
      });
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const moduleId = 'nonexistent';
      mockGameModuleRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getModuleProgress(userId, moduleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSectionProgress', () => {
    it('should return detailed progress for a section', async () => {
      // Setup
      const sectionId = 'section1-1';
      mockGameSectionRepository.findOne.mockResolvedValue({
        ...mockModules[0].sections[0],
        module: mockModules[0]
      });
      mockUserProgressRepository.findOne.mockResolvedValue(mockProgress[1]);
      mockCheckpointRepository.find.mockResolvedValue(mockCheckpoints);

      // Execute
      const result = await service.getSectionProgress(userId, sectionId);

      // Verify
      expect(result.sectionId).toEqual(sectionId);
      expect(result.userId).toEqual(userId);
      expect(result.status).toEqual(ProgressStatus.COMPLETED);
      expect(mockGameSectionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sectionId },
        relations: ['module']
      });
    });

    it('should throw NotFoundException when section not found', async () => {
      // Setup
      const sectionId = 'nonexistent';
      mockGameSectionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getSectionProgress(userId, sectionId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('startModule', () => {
    it('should create new progress record when starting module for first time', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      mockUserProgressRepository.findOne.mockResolvedValue(null);
      
      const newProgress = {
        id: 'new-progress',
        userId,
        moduleId,
        sectionId: null,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      mockUserProgressRepository.create.mockReturnValue(newProgress);
      mockUserProgressRepository.save.mockResolvedValue(newProgress);

      // Execute
      const result = await service.startModule(userId, moduleId);

      // Verify
      expect(result.moduleId).toEqual(moduleId);
      expect(mockUserProgressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          moduleId,
          sectionId: null,
          status: ProgressStatus.IN_PROGRESS
        })
      );
      expect(mockUserProgressRepository.save).toHaveBeenCalled();
    });

    it('should update existing progress when already started', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      
      const existingProgress = {
        id: 'existing-progress',
        userId,
        moduleId,
        sectionId: null,
        status: ProgressStatus.NOT_STARTED,
        startedAt: null,
        updatedAt: null
      };
      
      mockUserProgressRepository.findOne.mockResolvedValue(existingProgress);
      mockUserProgressRepository.save.mockImplementation(data => data);

      // Execute
      const result = await service.startModule(userId, moduleId);

      // Verify
      expect(result.moduleId).toEqual(moduleId);
      expect(mockUserProgressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProgressStatus.IN_PROGRESS,
          startedAt: expect.any(Date)
        })
      );
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const moduleId = 'nonexistent';
      mockGameModuleRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.startModule(userId, moduleId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when prerequisite module not completed', async () => {
      // Setup
      const moduleId = 'module2'; // Has prerequisite
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[1]);
      
      // Mock isModuleCompleted to return false
      jest.spyOn(service as any, 'isModuleCompleted').mockResolvedValue(false);

      // Execute & Verify
      await expect(service.startModule(userId, moduleId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startSection', () => {
    it('should create new progress record when starting section for first time', async () => {
      // Setup
      const sectionId = 'section1-1';
      mockGameSectionRepository.findOne.mockResolvedValue(mockModules[0].sections[0]);
      
      // Mock startModule
      jest.spyOn(service, 'startModule').mockResolvedValue({} as any);
      
      // Mock isFirstSectionInModule
      jest.spyOn(service as any, 'isFirstSectionInModule').mockResolvedValue(true);
      
      mockUserProgressRepository.findOne.mockResolvedValue(null);
      
      const newProgress = {
        id: 'new-section-progress',
        userId,
        moduleId: 'module1',
        sectionId,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date()
      };
      
      mockUserProgressRepository.create.mockReturnValue(newProgress);
      mockUserProgressRepository.save.mockResolvedValue(newProgress);

      // Execute
      const result = await service.startSection(userId, sectionId);

      // Verify
      expect(result.moduleId).toEqual('module1');
      expect(service.startModule).toHaveBeenCalled();
      expect(mockUserProgressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          sectionId,
          status: ProgressStatus.IN_PROGRESS
        })
      );
    });

    it('should throw ForbiddenException when previous section not completed', async () => {
      // Setup
      const sectionId = 'section1-2';
      mockGameSectionRepository.findOne.mockResolvedValue(mockModules[0].sections[1]);
      
      // Mock startModule
      jest.spyOn(service, 'startModule').mockResolvedValue({} as any);
      
      // Mock isFirstSectionInModule
      jest.spyOn(service as any, 'isFirstSectionInModule').mockResolvedValue(false);
      
      // Mock isPreviousSectionCompleted
      jest.spyOn(service as any, 'isPreviousSectionCompleted').mockResolvedValue(false);

      // Execute & Verify
      await expect(service.startSection(userId, sectionId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeCheckpoint', () => {
    it('should create new checkpoint record when completing for first time', async () => {
      // Setup
      const sectionId = 'section1-1';
      const checkpointDto: CheckpointCompletionDto = {
        sectionId,
        isCompleted: true,
        responses: { answered: true },
        timeSpent: 120
      };
      
      mockGameSectionRepository.findOne.mockResolvedValue(mockModules[0].sections[0]);
      
      // Mock startSection
      jest.spyOn(service, 'startSection').mockResolvedValue({} as any);
      
      mockUserProgressRepository.findOne.mockResolvedValue(mockProgress[1]);
      mockCheckpointRepository.findOne.mockResolvedValue(null);
      
      const newCheckpoint = {
        progressId: 'progress2',
        checkpointType: 'content',
        completedAt: expect.any(Date),
        responses: checkpointDto.responses,
        timeSpent: checkpointDto.timeSpent
      };
      
      mockCheckpointRepository.create.mockReturnValue(newCheckpoint);
      mockCheckpointRepository.save.mockResolvedValue(newCheckpoint);
      mockUserProgressRepository.save.mockResolvedValue(mockProgress[1]);

      // Execute
      const result = await service.completeCheckpoint(userId, checkpointDto);

      // Verify
      expect(result.success).toBe(true);
      expect(mockCheckpointRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          progressId: 'progress2',
          completedAt: expect.any(Date)
        })
      );
    });

    it('should update existing checkpoint when already exists', async () => {
      // Setup
      const sectionId = 'section1-1';
      const checkpointDto: CheckpointCompletionDto = {
        sectionId,
        isCompleted: true,
        responses: { answered: true },
        timeSpent: 150
      };
      
      mockGameSectionRepository.findOne.mockResolvedValue(mockModules[0].sections[0]);
      
      // Mock startSection
      jest.spyOn(service, 'startSection').mockResolvedValue({} as any);
      
      mockUserProgressRepository.findOne.mockResolvedValue(mockProgress[1]);
      mockCheckpointRepository.findOne.mockResolvedValue(mockCheckpoints[0]);
      
      const updatedCheckpoint = {
        ...mockCheckpoints[0],
        timeSpent: 150
      };
      
      mockCheckpointRepository.save.mockResolvedValue(updatedCheckpoint);
      mockUserProgressRepository.save.mockResolvedValue(mockProgress[1]);

      // Execute
      const result = await service.completeCheckpoint(userId, checkpointDto);

      // Verify
      expect(result.success).toBe(true);
      expect(mockCheckpointRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          timeSpent: 150
        })
      );
    });
  });

  describe('updateProgress', () => {
    it('should update progress status and set completedAt when completing', async () => {
      // Setup
      const updateDto: UpdateUserProgressDto = {
        status: 'completed',
        moduleId: 'module1',
        sectionId: 'section1-2'
      } as any;
      
      const existingProgress = {
        id: 'progress3',
        userId,
        moduleId: 'module1',
        sectionId: 'section1-2',
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date('2025-04-03'),
        completedAt: null,
        updatedAt: new Date('2025-04-03')
      };
      
      mockUserProgressRepository.findOne.mockResolvedValue(existingProgress);
      
      // Mock checkModuleCompletion
      jest.spyOn(service as any, 'checkModuleCompletion').mockResolvedValue(undefined);
      
      mockUserProgressRepository.save.mockImplementation(data => ({
        ...data,
        updatedAt: new Date()
      }));

      // Execute
      const result = await service.updateProgress(userId, updateDto);

      // Verify
      expect(result.isCompleted).toBe(true);
      expect(mockUserProgressRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          completedAt: expect.any(Date)
        })
      );
      expect(service['checkModuleCompletion']).toHaveBeenCalledWith(userId, 'module1');
    });

    it('should auto-start module if no progress record exists', async () => {
      // Setup
      const updateDto: UpdateUserProgressDto = {
        status: 'in_progress',
        moduleId: 'module1'
      } as any;
      
      mockUserProgressRepository.findOne.mockResolvedValue(null);
      
      // Mock startModule
      jest.spyOn(service, 'startModule').mockResolvedValue({
        id: 'new-progress',
        moduleId: 'module1',
        userId
      } as any);

      // Execute
      const result = await service.updateProgress(userId, updateDto);

      // Verify
      expect(result).toBeDefined();
      expect(service.startModule).toHaveBeenCalledWith(userId, 'module1');
    });
  });
});