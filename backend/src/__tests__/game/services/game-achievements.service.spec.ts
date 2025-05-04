import { Test, TestingModule } from '@nestjs/testing';
import { GameAchievementsService } from '../../../game/services/game-achievements.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Achievement } from '../../../game/entities/achievement.entity';
import { UserAchievement } from '../../../game/entities/user-achievement.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AchievementDto, AchievementUnlockDto, UserAchievementDto } from '../../../game/dto/achievement.dto';
import { AchievementUnlockedEvent } from '../../../game/events/achievement-unlocked.event';

describe('GameAchievementsService', () => {
  let service: GameAchievementsService;
  let achievementRepository: Repository<Achievement>;
  let userAchievementRepository: Repository<UserAchievement>;
  let eventEmitter: EventEmitter2;

  // Mock data
  const mockAchievements = [
    {
      id: '1',
      name: 'First Module Complete',
      description: 'Complete your first module',
      imageUrl: 'first-module.png',
      points: 10,
      requirements: '{ "modulesCompleted": 1 }',
      isActive: true,
    },
    {
      id: '2',
      name: 'Five Modules Complete',
      description: 'Complete five modules',
      imageUrl: 'five-modules.png',
      points: 50,
      requirements: '{ "modulesCompleted": 5 }',
      isActive: true,
    },
    {
      id: '3',
      name: 'Inactive Achievement',
      description: 'This achievement is inactive',
      imageUrl: 'inactive.png',
      points: 20,
      requirements: '{ "special": true }',
      isActive: false,
    }
  ];

  const mockUserAchievements = [
    {
      id: 'ua1',
      userId: 'user1',
      achievementId: '1',
      unlockedAt: new Date('2025-04-15'),
      achievement: mockAchievements[0],
    }
  ];

  // Mock repositories
  const mockAchievementRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockUserAchievementRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameAchievementsService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: mockAchievementRepository,
        },
        {
          provide: getRepositoryToken(UserAchievement),
          useValue: mockUserAchievementRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<GameAchievementsService>(GameAchievementsService);
    achievementRepository = module.get<Repository<Achievement>>(getRepositoryToken(Achievement));
    userAchievementRepository = module.get<Repository<UserAchievement>>(getRepositoryToken(UserAchievement));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllAchievements', () => {
    it('should return all active achievements', async () => {
      // Setup
      const activeAchievements = mockAchievements.filter(a => a.isActive);
      mockAchievementRepository.find.mockResolvedValue(activeAchievements);

      // Execute
      const result = await service.getAllAchievements();

      // Verify
      expect(result.length).toEqual(activeAchievements.length);
      expect(mockAchievementRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { id: 'ASC' }
      });
      expect(result[0].id).toEqual(activeAchievements[0].id);
      expect(result[0].name).toEqual(activeAchievements[0].name);
    });
  });

  describe('getUserAchievements', () => {
    it('should return all achievements for a user including unlocked status', async () => {
      // Setup
      const userId = 'user1';
      const activeAchievements = mockAchievements.filter(a => a.isActive);
      mockAchievementRepository.find.mockResolvedValue(activeAchievements);
      mockUserAchievementRepository.find.mockResolvedValue(mockUserAchievements);

      // Execute
      const result = await service.getUserAchievements(userId);

      // Verify
      expect(result.length).toEqual(activeAchievements.length);
      expect(mockAchievementRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { id: 'ASC' }
      });
      expect(mockUserAchievementRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['achievement']
      });
      
      // First achievement should be unlocked
      expect(result[0].unlockedAt).not.toBeNull();
      // Second achievement should not be unlocked
      expect(result[1].unlockedAt).toBeNull();
    });
  });

  describe('unlockAchievement', () => {
    it('should throw NotFoundException when achievement does not exist', async () => {
      // Setup
      const userId = 'user1';
      const achievementDto: AchievementDto = {
        id: 'nonexistent',
        name: 'Nonexistent Achievement',
        description: 'This achievement does not exist',
        imageUrl: 'nonexistent.png',
        points: 10,
        requirements: '{ "moduleId": "module1" }',
        isActive: true
      };

      const unlockDto: AchievementUnlockDto = {
        achievement: achievementDto,
        isNew: true,
        unlockedAt: new Date()
      };
      
      mockAchievementRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.unlockAchievement(userId, unlockDto)).rejects.toThrow(NotFoundException);
      expect(mockAchievementRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
    });

    it('should return existing achievement when already unlocked', async () => {
      // Setup
      const userId = 'user1';
      const achievementDto: AchievementDto = {
        id: '1',
        name: 'First Module Complete',
        description: 'Complete your first module',
        imageUrl: 'first-module.png',
        points: 10,
        requirements: '{ "modulesCompleted": 1 }',
        isActive: true
      };

      const unlockDto: AchievementUnlockDto = {
        achievement: achievementDto,
        isNew: true,
        unlockedAt: new Date()
      };
      
      const existingAchievement = mockUserAchievements[0];
      
      mockAchievementRepository.findOne.mockResolvedValue(mockAchievements[0]);
      mockUserAchievementRepository.findOne.mockResolvedValue(existingAchievement);

      // Execute
      const result = await service.unlockAchievement(userId, unlockDto);

      // Verify
      expect(result.id).toEqual(existingAchievement.id);
      expect(result.unlockedAt).toEqual(existingAchievement.unlockedAt);
      expect(mockAchievementRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(mockUserAchievementRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          achievementId: '1'
        }
      });
      // Event should not be emitted
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should create new achievement and emit event when unlocking for first time', async () => {
      // Setup
      const userId = 'user1';
      const achievementDto: AchievementDto = {
        id: '2',
        name: 'Five Modules Complete',
        description: 'Complete five modules',
        imageUrl: 'five-modules.png',
        points: 50,
        requirements: '{ "modulesCompleted": 5 }',
        isActive: true
      };

      const unlockDto: AchievementUnlockDto = {
        achievement: achievementDto,
        isNew: true,
        unlockedAt: new Date()
      };
      
      const achievement = mockAchievements[1];
      const newUserAchievement = {
        id: 'new-ua-id',
        userId,
        achievementId: '2',
        unlockedAt: new Date()
      };
      
      mockAchievementRepository.findOne.mockResolvedValue(achievement);
      mockUserAchievementRepository.findOne.mockResolvedValue(null);
      mockUserAchievementRepository.create.mockReturnValue(newUserAchievement);
      mockUserAchievementRepository.save.mockResolvedValue(newUserAchievement);

      // Execute
      const result = await service.unlockAchievement(userId, unlockDto);

      // Verify
      expect(result.id).toEqual(newUserAchievement.id);
      expect(result.achievementId).toEqual('2');
      expect(mockUserAchievementRepository.create).toHaveBeenCalledWith({
        userId,
        achievementId: '2',
        unlockedAt: expect.any(Date)
      });
      expect(mockUserAchievementRepository.save).toHaveBeenCalledWith(newUserAchievement);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'achievement.unlocked', 
        expect.any(AchievementUnlockedEvent)
      );
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should return empty array when no achievements to unlock', async () => {
      // Setup
      const userId = 'user1';
      const points = 5;
      mockUserAchievementRepository.find.mockResolvedValue(mockUserAchievements);
      mockAchievementRepository.find.mockResolvedValue([]);

      // Execute
      const result = await service.checkAndUnlockAchievements(userId, points);

      // Verify
      expect(result).toEqual([]);
      expect(mockUserAchievementRepository.find).toHaveBeenCalledWith({
        where: { userId },
        select: ['achievementId']
      });
    });

    // Additional test cases can be added for this method
  });

  describe('getAchievementDetails', () => {
    it('should return achievement details when found', async () => {
      // Setup
      const achievementId = '1';
      mockAchievementRepository.findOne.mockResolvedValue(mockAchievements[0]);

      // Execute
      const result = await service.getAchievementDetails(achievementId);

      // Verify
      expect(result.id).toEqual(achievementId);
      expect(result.name).toEqual(mockAchievements[0].name);
      expect(mockAchievementRepository.findOne).toHaveBeenCalledWith({
        where: { id: achievementId }
      });
    });

    it('should throw NotFoundException when achievement not found', async () => {
      // Setup
      const achievementId = 'nonexistent';
      mockAchievementRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getAchievementDetails(achievementId)).rejects.toThrow(NotFoundException);
      expect(mockAchievementRepository.findOne).toHaveBeenCalledWith({
        where: { id: achievementId }
      });
    });
  });

  describe('hasUnlockedAchievement', () => {
    it('should return true when user has unlocked achievement', async () => {
      // Setup
      const userId = 'user1';
      const achievementId = '1';
      mockUserAchievementRepository.count.mockResolvedValue(1);

      // Execute
      const result = await service.hasUnlockedAchievement(userId, achievementId);

      // Verify
      expect(result).toBe(true);
      expect(mockUserAchievementRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          achievementId
        }
      });
    });

    it('should return false when user has not unlocked achievement', async () => {
      // Setup
      const userId = 'user1';
      const achievementId = '2';
      mockUserAchievementRepository.count.mockResolvedValue(0);

      // Execute
      const result = await service.hasUnlockedAchievement(userId, achievementId);

      // Verify
      expect(result).toBe(false);
    });
  });

  describe('getUserAchievementSummary', () => {
    it('should return user achievement summary', async () => {
      // Setup
      const userId = 'user1';
      mockAchievementRepository.count.mockResolvedValue(10);
      mockUserAchievementRepository.count.mockResolvedValue(5);
      jest.spyOn(service, 'getRecentAchievements').mockResolvedValue(mockUserAchievements.map(ua => ({
        id: ua.id,
        userId: ua.userId,
        achievementId: ua.achievementId,
        achievement: ua.achievement,
        unlockedAt: ua.unlockedAt
      })));

      // Execute
      const result = await service.getUserAchievementSummary(userId);

      // Verify
      expect(result.totalAchievements).toEqual(10);
      expect(result.unlockedAchievements).toEqual(5);
      expect(result.percentageComplete).toEqual(50);
      expect(result.recentlyUnlocked.length).toEqual(1);
      expect(service.getRecentAchievements).toHaveBeenCalledWith(userId, 3);
    });
  });
});