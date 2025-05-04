import { Test, TestingModule } from '@nestjs/testing';
import { GameModulesService } from '../../../game/services/game-modules.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameModule } from '../../../game/entities/game-module.entity';
import { GameSection } from '../../../game/entities/game-section.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GameModulesService', () => {
  let service: GameModulesService;
  let gameModuleRepository: Repository<GameModule>;
  let gameSectionRepository: Repository<GameSection>;

  const mockGameModuleRepository = {
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    })),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockGameSectionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameModulesService,
        {
          provide: getRepositoryToken(GameModule),
          useValue: mockGameModuleRepository,
        },
        {
          provide: getRepositoryToken(GameSection),
          useValue: mockGameSectionRepository,
        },
      ],
    }).compile();

    service = module.get<GameModulesService>(GameModulesService);
    gameModuleRepository = module.get<Repository<GameModule>>(getRepositoryToken(GameModule));
    gameSectionRepository = module.get<Repository<GameSection>>(getRepositoryToken(GameSection));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of game modules', async () => {
      const modules = [
        {
          id: '1',
          title: 'Test Module 1',
          description: 'Description 1',
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Test Module 2',
          description: 'Description 2',
          orderIndex: 1,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const queryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(modules),
        getCount: jest.fn().mockResolvedValue(modules.length),
      };

      jest.spyOn(mockGameModuleRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAll();

      expect(result.totalCount).toEqual(modules.length);
      expect(result.modules.length).toEqual(modules.length);
      expect(mockGameModuleRepository.createQueryBuilder).toHaveBeenCalledWith('module');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('module.orderIndex', 'ASC');
    });

    it('should filter by active status when provided', async () => {
      const activeModules = [
        {
          id: '1',
          title: 'Test Active Module',
          description: 'Active Module',
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const queryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeModules),
        getCount: jest.fn().mockResolvedValue(activeModules.length),
      };

      jest.spyOn(mockGameModuleRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAll(true);

      expect(result.totalCount).toEqual(activeModules.length);
      expect(queryBuilder.where).toHaveBeenCalledWith('module.isActive = :active', { active: true });
    });
  });

  describe('findOne', () => {
    it('should return a game module if found', async () => {
      const moduleId = '1';
      const mockModule = {
        id: moduleId,
        title: 'Test Module',
        description: 'Description',
        orderIndex: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(mockGameModuleRepository, 'findOne').mockResolvedValue(mockModule);

      const result = await service.findOne(moduleId);

      expect(result).toBeDefined();
      expect(result.id).toEqual(moduleId);
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({ where: { id: moduleId } });
    });

    it('should throw NotFoundException if module not found', async () => {
      const moduleId = 'non-existent-id';
      
      jest.spyOn(mockGameModuleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(moduleId)).rejects.toThrow(NotFoundException);
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({ where: { id: moduleId } });
    });
  });

  // Additional tests for other methods can be added here
});