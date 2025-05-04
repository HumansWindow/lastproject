import { Test, TestingModule } from '@nestjs/testing';
import { GameSectionsService } from '../../../game/services/game-sections.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GameSection } from '../../../game/entities/game-section.entity';
import { GameModule } from '../../../game/entities/game-module.entity';
import { SectionContent } from '../../../game/entities/section-content.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GameSectionsService', () => {
  let service: GameSectionsService;
  let gameSectionRepository: Repository<GameSection>;
  let gameModuleRepository: Repository<GameModule>;
  let sectionContentRepository: Repository<SectionContent>;

  const mockGameSectionRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
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

  const mockGameModuleRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockSectionContentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameSectionsService,
        {
          provide: getRepositoryToken(GameSection),
          useValue: mockGameSectionRepository,
        },
        {
          provide: getRepositoryToken(GameModule),
          useValue: mockGameModuleRepository,
        },
        {
          provide: getRepositoryToken(SectionContent),
          useValue: mockSectionContentRepository,
        },
      ],
    }).compile();

    service = module.get<GameSectionsService>(GameSectionsService);
    gameSectionRepository = module.get<Repository<GameSection>>(getRepositoryToken(GameSection));
    gameModuleRepository = module.get<Repository<GameModule>>(getRepositoryToken(GameModule));
    sectionContentRepository = module.get<Repository<SectionContent>>(getRepositoryToken(SectionContent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByModule', () => {
    it('should throw NotFoundException if module does not exist', async () => {
      const moduleId = 'non-existent-module';
      
      jest.spyOn(mockGameModuleRepository, 'count').mockResolvedValue(0);

      await expect(service.findAllByModule(moduleId)).rejects.toThrow(NotFoundException);
      expect(mockGameModuleRepository.count).toHaveBeenCalledWith({ where: { id: moduleId } });
    });

    it('should return a list of sections for a module', async () => {
      const moduleId = 'module-1';
      const sections = [
        {
          id: 'section-1',
          moduleId: moduleId,
          title: 'Test Section 1',
          sectionType: 'text-image',
          orderIndex: 0,
          backgroundType: 'default',
          configuration: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'section-2',
          moduleId: moduleId,
          title: 'Test Section 2',
          sectionType: 'card-carousel',
          orderIndex: 1,
          backgroundType: 'galaxy',
          configuration: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(mockGameModuleRepository, 'count').mockResolvedValue(1);
      
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(sections),
        getCount: jest.fn().mockResolvedValue(sections.length),
      };

      jest.spyOn(mockGameSectionRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAllByModule(moduleId);

      expect(result.totalCount).toEqual(sections.length);
      expect(result.sections.length).toEqual(sections.length);
      expect(result.moduleId).toEqual(moduleId);
      expect(mockGameSectionRepository.createQueryBuilder).toHaveBeenCalledWith('section');
      expect(queryBuilder.where).toHaveBeenCalledWith('section.moduleId = :moduleId', { moduleId });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('section.orderIndex', 'ASC');
    });

    it('should filter by active status when provided', async () => {
      const moduleId = 'module-1';
      const activeSections = [
        {
          id: 'section-1',
          moduleId: moduleId,
          title: 'Test Active Section',
          sectionType: 'text-image',
          orderIndex: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(mockGameModuleRepository, 'count').mockResolvedValue(1);
      
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeSections),
        getCount: jest.fn().mockResolvedValue(activeSections.length),
      };

      jest.spyOn(mockGameSectionRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.findAllByModule(moduleId, true);

      expect(result.totalCount).toEqual(activeSections.length);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('section.isActive = :active', { active: true });
    });
  });

  describe('findOne', () => {
    it('should return a section if found', async () => {
      const sectionId = 'section-1';
      const moduleId = 'module-1';
      const mockSection = {
        id: sectionId,
        moduleId: moduleId,
        module: {
          id: moduleId,
          title: 'Test Module',
        },
        title: 'Test Section',
        sectionType: 'text-image',
        orderIndex: 0,
        backgroundType: 'default',
        configuration: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(mockGameSectionRepository, 'findOne').mockResolvedValue(mockSection);

      const result = await service.findOne(sectionId);

      expect(result).toBeDefined();
      expect(result.id).toEqual(sectionId);
      expect(result.moduleId).toEqual(moduleId);
      expect(result.moduleName).toEqual('Test Module');
      expect(mockGameSectionRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: sectionId },
        relations: ['module']
      });
    });

    it('should throw NotFoundException if section not found', async () => {
      const sectionId = 'non-existent-id';
      
      jest.spyOn(mockGameSectionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(sectionId)).rejects.toThrow(NotFoundException);
      expect(mockGameSectionRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: sectionId },
        relations: ['module']
      });
    });
  });

  // Additional tests for other methods can be added here
});