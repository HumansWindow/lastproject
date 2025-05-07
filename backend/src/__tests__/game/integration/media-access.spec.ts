import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MediaService } from '../../../game/services/media.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { MediaAssetRepository } from '../../../game/repositories/media-asset.repository';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '../../../game/dto/media.dto';

// Create a mock GameModule instead of importing the entire AppModule
const createTestingModule = async () => {
  // Mock user for testing
  const testUser = { id: 'test-user-123', username: 'testuser', roles: ['user'] };
  
  return Test.createTestingModule({
    providers: [
      MediaService,
      {
        provide: MediaAssetRepository,
        useValue: {
          findAll: jest.fn(),
          findById: jest.fn(),
          findByIds: jest.fn(),
        },
      },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockImplementation((key) => {
            if (key === 'UPLOAD_DIR') return 'uploads/test';
            if (key === 'MAX_FILE_SIZE') return 10 * 1024 * 1024; // 10MB
            return null;
          }),
        },
      },
    ],
    controllers: [], // We'll mock the HTTP requests directly
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = testUser;
        return true;
      },
    });
};

describe('Media Access Integration Tests', () => {
  let app: INestApplication;
  let mediaService: MediaService;
  let mediaAssetRepository: MediaAssetRepository;
  
  // Mock media assets
  const mockMediaAssets = [
    {
      id: 'media-1',
      filename: 'example.jpg',
      filePath: '/uploads/images/example.jpg',
      mimeType: 'image/jpeg',
      fileSize: 102400, // 100 KB
      width: 800,
      height: 600,
      createdAt: new Date(),
      createdBy: 'admin',
      mediaType: MediaType.IMAGE,
      altText: 'Example image',
      metadata: {
        responsive: {
          small: '/uploads/images/example-small.jpg',
          medium: '/uploads/images/example-medium.jpg',
          large: '/uploads/images/example-large.jpg'
        },
        formats: {
          webp: '/uploads/images/example.webp',
          avif: '/uploads/images/example.avif'
        }
      }
    },
    {
      id: 'media-2',
      filename: 'example.mp4',
      filePath: '/uploads/videos/example.mp4',
      mimeType: 'video/mp4',
      fileSize: 5242880, // 5 MB
      createdAt: new Date(),
      createdBy: 'admin',
      mediaType: MediaType.VIDEO,
      metadata: {
        duration: 120,
        resolution: '1280x720',
        poster: '/uploads/images/video-poster.jpg',
        formats: {
          hls: '/uploads/videos/example.m3u8',
          dash: '/uploads/videos/example.mpd'
        },
        qualities: {
          '360p': '/uploads/videos/example-360p.mp4',
          '720p': '/uploads/videos/example-720p.mp4'
        }
      }
    },
    {
      id: 'media-3',
      filename: 'example.pdf',
      filePath: '/uploads/documents/example.pdf',
      mimeType: 'application/pdf',
      fileSize: 1048576, // 1 MB
      createdAt: new Date(),
      createdBy: 'admin',
      mediaType: MediaType.DOCUMENT,
      metadata: {
        pages: 5,
        thumbnail: '/uploads/images/pdf-thumbnail.jpg'
      }
    }
  ];

  beforeEach(async () => {
    // Create a testing module with mocked services
    const moduleRef = await createTestingModule();
    const moduleFixture = await moduleRef.compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    mediaService = moduleFixture.get<MediaService>(MediaService);
    mediaAssetRepository = moduleFixture.get<MediaAssetRepository>(MediaAssetRepository);

    // Mock repository methods
    jest.spyOn(mediaAssetRepository, 'findAll').mockResolvedValue({
      assets: mockMediaAssets,
      totalCount: mockMediaAssets.length,
      page: 1,
      limit: 10
    });
    
    jest.spyOn(mediaAssetRepository, 'findById').mockImplementation(
      (id: string) => Promise.resolve(mockMediaAssets.find(asset => asset.id === id) || null)
    );
    
    jest.spyOn(mediaAssetRepository, 'findByIds').mockImplementation(
      (ids: string[]) => Promise.resolve(mockMediaAssets.filter(asset => ids.includes(asset.id)))
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.resetAllMocks();
  });

  describe('Media Asset Retrieval', () => {
    it('should retrieve a list of media assets', async () => {
      // Mock service method directly instead of HTTP request
      const result = await mediaService.findAll({ page: 1, limit: 10 });
      
      expect(result.assets).toHaveLength(mockMediaAssets.length);
      expect(result.assets[0].id).toBe('media-1');
      expect(mediaAssetRepository.findAll).toHaveBeenCalled();
    });

    it('should retrieve a specific media asset by ID', async () => {
      const result = await mediaService.findById('media-1');
      
      expect(result.id).toBe('media-1');
      expect(result.filename).toBe('example.jpg');
      expect(mediaAssetRepository.findById).toHaveBeenCalledWith('media-1');
    });
  });

  describe('Media Format Selection', () => {
    it('should provide appropriate formats based on client capabilities', async () => {
      // Test with browser that supports WebP
      const asset = mockMediaAssets[0];
      
      // Test WebP support
      const clientInfoWebp = { supportsWebp: true, supportsAvif: false };
      const webpResult = await mediaService.getOptimizedMediaUrl(asset, clientInfoWebp);
      expect(webpResult).toBe(asset.metadata.formats.webp);
      
      // Test AVIF support
      const clientInfoAvif = { supportsWebp: false, supportsAvif: true };
      const avifResult = await mediaService.getOptimizedMediaUrl(
        { ...asset, formats: { webp: undefined, avif: asset.metadata.formats.avif } },
        clientInfoAvif
      );
      expect(avifResult).toBe(asset.metadata.formats.avif);
      
      // Test fallback to original
      const clientInfoNoSupport = { supportsWebp: false, supportsAvif: false };
      const fallbackResult = await mediaService.getOptimizedMediaUrl(asset, clientInfoNoSupport);
      expect(fallbackResult).toBe(asset.filePath);
    });
  });

  describe('Responsive Image Handling', () => {
    it('should return appropriate responsive image sizes', async () => {
      const asset = mockMediaAssets[0];
      
      const result = await mediaService.getResponsiveImageUrls(asset);
      
      expect(result.small).toBe(asset.metadata.responsive.small);
      expect(result.medium).toBe(asset.metadata.responsive.medium);
      expect(result.large).toBe(asset.metadata.responsive.large);
      expect(result.original).toBe(asset.filePath);
    });
  });

  describe('Video Streaming Options', () => {
    it('should provide video streaming options', async () => {
      const asset = mockMediaAssets[1];
      
      const result = await mediaService.getVideoStreamingOptions(asset);
      
      expect(result.hls).toBe(asset.metadata.formats.hls);
      expect(result.dash).toBe(asset.metadata.formats.dash);
      expect(result.mp4['360p']).toBe(asset.metadata.qualities['360p']);
      expect(result.mp4['720p']).toBe(asset.metadata.qualities['720p']);
    });
  });

  describe('Media Asset Metadata', () => {
    it('should return detailed metadata for media assets', async () => {
      const asset = mockMediaAssets[0];
      
      const result = await mediaService.getMediaMetadata(asset);
      
      expect(result.id).toBe(asset.id);
      expect(result.filename).toBe('example.jpg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });
  });

  describe('Media Reference Processing', () => {
    it('should process media references in content', async () => {
      const contentWithMediaRef = {
        text: 'Example content with image',
        mediaId: 'media-1'
      };
      
      jest.spyOn(mediaService, 'findById').mockResolvedValue({
        id: 'media-1',
        filename: 'example.jpg',
        filePath: '/uploads/images/example.jpg',
        // Add other required properties for MediaAssetDto
        mimeType: 'image/jpeg',
        fileSize: 102400,
        altText: 'Example image',
        mediaType: MediaType.IMAGE,
        category: 'image',
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const result = await mediaService.processMediaReferences(contentWithMediaRef);
      
      expect(result.url).toBe('/uploads/images/example.jpg');
      expect(result.mediaId).toBe('media-1');
      expect(result.text).toBe('Example content with image');
    });
  });
});