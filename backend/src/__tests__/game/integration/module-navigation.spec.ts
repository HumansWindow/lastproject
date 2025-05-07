import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GameModulesService } from '../../../game/services/game-modules.service';
import { GameSectionsService } from '../../../game/services/game-sections.service';
import { UserProgressService } from '../../../game/services/user-progress.service';
import { AppModule } from '../../../app.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { GameModule } from '../../../game/entities/game-module.entity';
import { GameSection } from '../../../game/entities/game-section.entity';

describe('Module Navigation Integration Tests', () => {
  let app: INestApplication;
  let gameModulesService: GameModulesService;
  let gameSectionsService: GameSectionsService;
  let userProgressService: UserProgressService;
  
  // Mock user for testing
  const testUser = { id: 'test-user-123', username: 'testuser', roles: ['user'] };
  
  // Mock modules and sections for testing
  const mockModules: Partial<GameModule>[] = [
    { 
      id: 'module-1', 
      title: 'Module 1', 
      description: 'First module', 
      orderIndex: 1,
      prerequisiteModuleId: null,
      isActive: true
    },
    { 
      id: 'module-2', 
      title: 'Module 2', 
      description: 'Second module', 
      orderIndex: 2,
      prerequisiteModuleId: 'module-1',
      isActive: true
    },
    { 
      id: 'module-3', 
      title: 'Module 3', 
      description: 'Third module', 
      orderIndex: 3,
      prerequisiteModuleId: 'module-2',
      isActive: true
    }
  ];
  
  const mockSections: Partial<GameSection>[] = [
    { id: 'section-1-1', title: 'Section 1.1', moduleId: 'module-1', orderIndex: 1 },
    { id: 'section-1-2', title: 'Section 1.2', moduleId: 'module-1', orderIndex: 2 },
    { id: 'section-2-1', title: 'Section 2.1', moduleId: 'module-2', orderIndex: 1 },
    { id: 'section-2-2', title: 'Section 2.2', moduleId: 'module-2', orderIndex: 2 },
    { id: 'section-3-1', title: 'Section 3.1', moduleId: 'module-3', orderIndex: 1 }
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
    gameModulesService = moduleFixture.get<GameModulesService>(GameModulesService);
    gameSectionsService = moduleFixture.get<GameSectionsService>(GameSectionsService);
    userProgressService = moduleFixture.get<UserProgressService>(UserProgressService);

    // Mock service methods
    jest.spyOn(gameModulesService, 'findAll').mockResolvedValue(mockModules as GameModule[]);
    jest.spyOn(gameModulesService, 'findOne').mockImplementation(
      (id: string) => Promise.resolve(mockModules.find(m => m.id === id) as GameModule)
    );
    
    jest.spyOn(gameSectionsService, 'getSectionsByModuleId').mockImplementation(
      (moduleId: string) => Promise.resolve(mockSections.filter(s => s.moduleId === moduleId) as GameSection[])
    );
    
    jest.spyOn(gameSectionsService, 'findOne').mockImplementation(
      (id: string) => Promise.resolve(mockSections.find(s => s.id === id) as GameSection)
    );

    jest.spyOn(userProgressService, 'getModuleProgress').mockResolvedValue({
      moduleId: 'module-1',
      started: true,
      completed: false,
      completedSections: 1,
      totalSections: 2,
      percentComplete: 50,
      lastAccessedAt: new Date()
    });
  });

  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  describe('Module Navigation Flow', () => {
    it('should retrieve a list of available modules', async () => {
      const response = await request(app.getHttpServer())
        .get('/game/modules')
        .expect(200);
      
      expect(response.body).toHaveLength(mockModules.length);
      expect(response.body[0].id).toBe(mockModules[0].id);
      expect(gameModulesService.findAll).toHaveBeenCalled();
    });

    it('should retrieve a specific module with its details', async () => {
      const moduleId = 'module-1';
      
      const response = await request(app.getHttpServer())
        .get(`/game/modules/${moduleId}`)
        .expect(200);
      
      expect(response.body.id).toBe(moduleId);
      expect(response.body.title).toBe(mockModules[0].title);
      expect(gameModulesService.findOne).toHaveBeenCalledWith(moduleId);
    });
    
    it('should retrieve sections for a module', async () => {
      const moduleId = 'module-1';
      
      const response = await request(app.getHttpServer())
        .get(`/game/modules/${moduleId}/sections`)
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('section-1-1');
      expect(response.body[1].id).toBe('section-1-2');
      expect(gameSectionsService.getSectionsByModuleId).toHaveBeenCalledWith(moduleId);
    });
    
    it('should retrieve user progress for a module', async () => {
      const moduleId = 'module-1';
      
      const response = await request(app.getHttpServer())
        .get(`/game/progress/modules/${moduleId}`)
        .expect(200);
      
      expect(response.body.moduleId).toBe(moduleId);
      expect(response.body.percentComplete).toBe(50);
      expect(userProgressService.getModuleProgress).toHaveBeenCalledWith(testUser.id, moduleId);
    });
    
    it('should navigate to the next section in a module', async () => {
      // Mock the navigation function - use the correct method name
      jest.spyOn(gameSectionsService, 'findNextInModule').mockResolvedValue(
        mockSections[1] as GameSection
      );
      
      const currentSectionId = 'section-1-1';
      
      const response = await request(app.getHttpServer())
        .get(`/game/sections/${currentSectionId}/next`)
        .expect(200);
      
      expect(response.body.id).toBe('section-1-2');
      expect(gameSectionsService.findNextInModule).toHaveBeenCalledWith(currentSectionId);
    });
    
    it('should navigate to the previous section in a module', async () => {
      // Mock the navigation function - use the correct method name
      jest.spyOn(gameSectionsService, 'findPreviousInModule').mockResolvedValue(
        mockSections[0] as GameSection
      );
      
      const currentSectionId = 'section-1-2';
      
      const response = await request(app.getHttpServer())
        .get(`/game/sections/${currentSectionId}/previous`)
        .expect(200);
      
      expect(response.body.id).toBe('section-1-1');
      expect(gameSectionsService.findPreviousInModule).toHaveBeenCalledWith(currentSectionId);
    });

    it('should handle completion of a section', async () => {
      // Mock the checkpoint creation - use the correct method name
      jest.spyOn(userProgressService, 'completeCheckpoint').mockResolvedValue({
        success: true
      });
      
      const sectionId = 'section-1-1';
      
      const response = await request(app.getHttpServer())
        .post(`/game/progress/sections/${sectionId}/checkpoint`)
        .send({
          timeSpent: 300,
          contentViewed: ['content-1', 'content-2']
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(userProgressService.completeCheckpoint).toHaveBeenCalled();
    });

    it('should handle completion of a module', async () => {
      // Mock completing all sections
      jest.spyOn(userProgressService, 'getModuleSectionProgress').mockResolvedValue({
        totalSections: 2,
        completedSections: 2,
        sections: [
          { id: 'section-1-1', completed: true },
          { id: 'section-1-2', completed: true }
        ]
      });

      // Mock the module completion - use the correct method name
      jest.spyOn(userProgressService, 'updateProgress').mockResolvedValue({
        id: 'progress-1',
        userId: testUser.id,
        moduleId: 'module-1',
        sectionsCompleted: 2,
        isCompleted: true,
        rewardClaimed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const moduleId = 'module-1';
      
      const response = await request(app.getHttpServer())
        .post(`/game/progress/modules/${moduleId}/complete`)
        .expect(201);
      
      expect(response.body.isCompleted).toBe(true); // changed from 'completed' to 'isCompleted' to match the DTO
      expect(response.body.moduleId).toBe('module-1'); // changed to match the expected response shape
      expect(userProgressService.updateProgress).toHaveBeenCalled();
    });
  });

  describe('Section Progress Tracking', () => {
    it('should track progression through multiple sections', async () => {
      // Configure mocks for this test scenario
      const moduleId = 'module-1';
      const checkpointMock = jest.spyOn(userProgressService, 'completeCheckpoint');
      
      // Complete first section
      checkpointMock.mockResolvedValueOnce({
        sectionId: 'section-1-1',
        completed: true,
        timeSpent: 300,
        nextSectionId: 'section-1-2'
      });
      
      await request(app.getHttpServer())
        .post(`/game/progress/sections/section-1-1/checkpoint`)
        .send({
          timeSpent: 300,
          contentViewed: ['content-1', 'content-2']
        })
        .expect(201);
      
      expect(checkpointMock).toHaveBeenCalled();
      
      // Complete second section
      checkpointMock.mockResolvedValueOnce({
        sectionId: 'section-1-2',
        completed: true,
        timeSpent: 450,
        nextSectionId: null,
        moduleCompleted: true
      });
      
      await request(app.getHttpServer())
        .post(`/game/progress/sections/section-1-2/checkpoint`)
        .send({
          timeSpent: 450,
          contentViewed: ['content-3', 'content-4']
        })
        .expect(201);
      
      // Check progress after completing all sections
      jest.spyOn(userProgressService, 'getModuleProgress').mockResolvedValueOnce({
        moduleId,
        started: true,
        completed: true,
        completedSections: 2,
        totalSections: 2,
        percentComplete: 100,
        lastAccessedAt: new Date()
      });
      
      const progressResponse = await request(app.getHttpServer())
        .get(`/game/progress/modules/${moduleId}`)
        .expect(200);
      
      expect(progressResponse.body.completed).toBe(true);
      expect(progressResponse.body.percentComplete).toBe(100);
    });
  });
});