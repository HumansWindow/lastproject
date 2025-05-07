import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SectionContentService } from '../../../game/services/section-content.service';
import { UserProgressService } from '../../../game/services/user-progress.service';
import { AppModule } from '../../../app.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { SectionContentType } from '../../../game/interfaces/content-types.interface';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserQuizResponse } from '../../../game/entities/quiz/user-quiz-response.entity';

describe('Content Viewing Integration Tests', () => {
  let app: INestApplication | null = null;
  let sectionContentService: SectionContentService;
  let userProgressService: UserProgressService;
  
  // Mock user for testing
  const testUser = { id: 'test-user-123', username: 'testuser', roles: ['user'] };
  
  // Mock content for testing
  const mockSectionId = 'section-123';
  const mockContentItems = [
    {
      id: 'content-1',
      section_id: mockSectionId,
      type: SectionContentType.TEXT,
      order_index: 1,
      content: { text: 'This is some text content' },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'content-2',
      section_id: mockSectionId,
      type: SectionContentType.IMAGE,
      order_index: 2,
      content: { 
        url: '/assets/images/example.jpg', 
        alt: 'Example image',
        caption: 'An example image'
      },
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'content-3',
      section_id: mockSectionId,
      type: SectionContentType.VIDEO,
      order_index: 3,
      content: { 
        url: '/assets/videos/example.mp4',
        poster: '/assets/images/video-poster.jpg',
        duration: 120,
        title: 'Example Video' 
      },
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  beforeEach(async () => {
    // Create a testing module with mocked services
    try {
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
      // Add mock repository for UserQuizResponseRepository
      .overrideProvider(getRepositoryToken(UserQuizResponse))
      .useValue({
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(entity => entity),
        save: jest.fn(entity => entity)
      })
      .compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      // Get service instances
      sectionContentService = moduleFixture.get<SectionContentService>(SectionContentService);
      userProgressService = moduleFixture.get<UserProgressService>(UserProgressService);

      // Mock service methods
      jest.spyOn(sectionContentService, 'getSectionContent').mockResolvedValue(mockContentItems);
      jest.spyOn(sectionContentService, 'getSectionContentWithProgress').mockResolvedValue(
        mockContentItems.map((item, index) => ({
          ...item,
          viewed: index === 0 // Only the first item is viewed initially
        }))
      );
      jest.spyOn(sectionContentService, 'trackContentInteraction').mockResolvedValue({ success: true });
      jest.spyOn(sectionContentService, 'getContentProgressStats').mockResolvedValue({
        total: 3,
        viewed: 1,
        percentage: 33
      });
      jest.spyOn(sectionContentService, 'markAllContentViewed').mockResolvedValue({
        success: true,
        contentCount: 3
      });
    } catch (error) {
      console.error('Error during module setup:', error);
    }
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.resetAllMocks();
  });

  describe('Content Retrieval and Progress Tracking', () => {
    it('should retrieve content for a section', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content`)
        .expect(200);
      
      expect(response.body).toHaveLength(mockContentItems.length);
      expect(response.body[0].id).toBe(mockContentItems[0].id);
      expect(sectionContentService.getSectionContent).toHaveBeenCalledWith(mockSectionId);
    });

    it('should retrieve content with progress indicators', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content/progress`)
        .expect(200);
      
      expect(response.body).toHaveLength(mockContentItems.length);
      expect(response.body[0].viewed).toBe(true);
      expect(response.body[1].viewed).toBe(false);
      expect(sectionContentService.getSectionContentWithProgress).toHaveBeenCalledWith(
        testUser.id,
        mockSectionId
      );
    });

    it('should track content interaction', async () => {
      const contentId = 'content-2';
      const timeSpent = 45; // seconds
      
      const response = await request(app.getHttpServer())
        .post(`/game/sections/${mockSectionId}/content/${contentId}/track`)
        .send({ timeSpent })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(sectionContentService.trackContentInteraction).toHaveBeenCalledWith(
        testUser.id,
        mockSectionId,
        contentId,
        timeSpent
      );
    });

    it('should get content progress statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content/stats`)
        .expect(200);
      
      expect(response.body).toEqual({
        total: 3,
        viewed: 1,
        percentage: 33
      });
      expect(sectionContentService.getContentProgressStats).toHaveBeenCalledWith(
        testUser.id,
        mockSectionId
      );
    });

    it('should mark all content as viewed', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game/sections/${mockSectionId}/content/mark-all-viewed`)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.contentCount).toBe(3);
      expect(sectionContentService.markAllContentViewed).toHaveBeenCalledWith(
        testUser.id,
        mockSectionId
      );
    });
  });

  describe('Content Interaction Flow', () => {
    it('should track progressive content viewing', async () => {
      // Mock the return values for this test scenario
      const trackContentMock = jest.spyOn(sectionContentService, 'trackContentInteraction');
      trackContentMock.mockResolvedValue({ success: true });
      
      // Track viewing the first content item
      await request(app.getHttpServer())
        .post(`/game/sections/${mockSectionId}/content/content-1/track`)
        .send({ timeSpent: 30 })
        .expect(201);
      
      // Track viewing the second content item
      await request(app.getHttpServer())
        .post(`/game/sections/${mockSectionId}/content/content-2/track`)
        .send({ timeSpent: 45 })
        .expect(201);
      
      // Update progress stats mock to show 2 items viewed
      jest.spyOn(sectionContentService, 'getContentProgressStats').mockResolvedValueOnce({
        total: 3,
        viewed: 2,
        percentage: 67
      });
      
      // Check updated progress stats
      const statsResponse = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content/stats`)
        .expect(200);
      
      expect(statsResponse.body.viewed).toBe(2);
      expect(statsResponse.body.percentage).toBe(67);
      
      // Track viewing the third content item
      await request(app.getHttpServer())
        .post(`/game/sections/${mockSectionId}/content/content-3/track`)
        .send({ timeSpent: 120 })
        .expect(201);
      
      // Update progress stats mock to show all items viewed
      jest.spyOn(sectionContentService, 'getContentProgressStats').mockResolvedValueOnce({
        total: 3,
        viewed: 3,
        percentage: 100
      });
      
      // Check complete progress stats
      const finalStatsResponse = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content/stats`)
        .expect(200);
      
      expect(finalStatsResponse.body.viewed).toBe(3);
      expect(finalStatsResponse.body.percentage).toBe(100);
      
      // Verify tracking was called for each content item
      expect(trackContentMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Content Type Handling', () => {
    it('should handle different content types properly', async () => {
      // Test retrieving and processing each type of content
      
      // Mock the getSectionContent function to return only one type of content at a time
      const contentServiceMock = jest.spyOn(sectionContentService, 'getSectionContent');
      
      // Test text content
      contentServiceMock.mockResolvedValueOnce([mockContentItems[0]]);
      
      const textResponse = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content`)
        .expect(200);
      
      expect(textResponse.body[0].type).toBe(SectionContentType.TEXT);
      expect(textResponse.body[0].content.text).toBe('This is some text content');
      
      // Test image content
      contentServiceMock.mockResolvedValueOnce([mockContentItems[1]]);
      
      const imageResponse = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content`)
        .expect(200);
      
      expect(imageResponse.body[0].type).toBe(SectionContentType.IMAGE);
      expect(imageResponse.body[0].content.url).toBe('/assets/images/example.jpg');
      
      // Test video content
      contentServiceMock.mockResolvedValueOnce([mockContentItems[2]]);
      
      const videoResponse = await request(app.getHttpServer())
        .get(`/game/sections/${mockSectionId}/content`)
        .expect(200);
      
      expect(videoResponse.body[0].type).toBe(SectionContentType.VIDEO);
      expect(videoResponse.body[0].content.duration).toBe(120);
    });
  });
});