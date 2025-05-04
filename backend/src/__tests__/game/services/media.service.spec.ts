import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from '../../../game/services/media.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaAssetRepository } from '../../../game/repositories/media-asset.repository';
import { MediaType } from '../../../game/dto/media.dto';
import * as fs from 'fs';
import * as path from 'path';

// Mock bcrypt which is causing issues with profile.entity.ts
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mocked-hash'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock app-root-path which is causing issues
jest.mock('app-root-path', () => ({
  path: '/mocked/root/path',
  resolve: (relativePath) => `/mocked/root/path/${relativePath}`
}));

jest.mock('fs');
jest.mock('path');

describe('MediaService', () => {
  let service: MediaService;
  let mediaAssetRepository: MediaAssetRepository;
  let configService: ConfigService;

  // Mock data
  const userId = 'user1';
  
  const mockMediaAssets = [
    {
      id: 'asset1',
      filename: 'test-image.jpg',
      filePath: '/media/2025/05/abc123.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      mediaType: MediaType.IMAGE,
      altText: 'Test Image',
      createdBy: 'user1',
      createdAt: new Date('2025-05-01'),
      updatedAt: new Date('2025-05-01')
    },
    {
      id: 'asset2',
      filename: 'test-document.pdf',
      filePath: '/media/2025/05/def456.pdf',
      mimeType: 'application/pdf',
      mediaType: MediaType.DOCUMENT,
      fileSize: 2048,
      altText: 'Test Document',
      createdBy: 'user1',
      createdAt: new Date('2025-05-02'),
      updatedAt: new Date('2025-05-02')
    }
  ];

  // Mock file
  const mockFile = {
    fieldname: 'file',
    originalname: 'test-upload.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test file content'),
    size: 1024,
  } as Express.Multer.File;

  // Mock MediaAssetRepository
  const mockMediaAssetRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findBySection: jest.fn(),
    findByModule: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    bulkSoftDelete: jest.fn(),
    getStatistics: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      if (key === 'UPLOAD_DIR') return './test-uploads/game';
      if (key === 'MAX_FILE_SIZE') return 10 * 1024 * 1024; // 10MB
      return defaultValue;
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaAssetRepository,
          useValue: mockMediaAssetRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    mediaAssetRepository = module.get<MediaAssetRepository>(MediaAssetRepository);
    configService = module.get<ConfigService>(ConfigService);

    // Mock filesystem functions
    (fs.existsSync as jest.Mock).mockImplementation(() => true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => undefined);
    (path.join as jest.Mock).mockImplementation((...paths) => paths.join('/'));
    (path.dirname as jest.Mock).mockReturnValue('./test-uploads/game/2025/05');
    (path.extname as jest.Mock).mockReturnValue('.jpg');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadMedia', () => {
    it('should upload a file and create a media asset record', async () => {
      // Setup
      const newAsset = { 
        ...mockMediaAssets[0],
        id: 'new-asset' 
      };
      
      mockMediaAssetRepository.create.mockResolvedValue(newAsset);

      // Execute
      const result = await service.uploadMedia(mockFile, userId, { altText: 'Custom Alt Text' });

      // Verify
      expect(result.id).toEqual(newAsset.id);
      expect(result.filename).toEqual(newAsset.filename);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockMediaAssetRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when file size exceeds limit', async () => {
      // Setup
      const largeFile = {
        ...mockFile,
        size: 20 * 1024 * 1024 // 20MB
      };

      // Execute & Verify
      await expect(service.uploadMedia(largeFile, userId)).rejects.toThrow(BadRequestException);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when file save fails', async () => {
      // Setup
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      // Execute & Verify
      await expect(service.uploadMedia(mockFile, userId)).rejects.toThrow(BadRequestException);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockMediaAssetRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getMediaAssets', () => {
    it('should return paginated media assets', async () => {
      // Setup
      mockMediaAssetRepository.findAll.mockResolvedValue({
        assets: mockMediaAssets,
        totalCount: mockMediaAssets.length,
        page: 1,
        limit: 10
      });

      // Execute
      const result = await service.getMediaAssets({}, 1, 10);

      // Verify
      expect(result.assets.length).toEqual(mockMediaAssets.length);
      expect(result.totalCount).toEqual(mockMediaAssets.length);
      expect(result.page).toEqual(1);
      expect(result.limit).toEqual(10);
      expect(mockMediaAssetRepository.findAll).toHaveBeenCalled();
    });

    it('should apply filters when provided', async () => {
      // Setup
      const filters = {
        search: 'test',
        mediaType: MediaType.IMAGE,
        createdBy: 'user1'
      };
      
      mockMediaAssetRepository.findAll.mockResolvedValue({
        assets: [mockMediaAssets[0]],
        totalCount: 1,
        page: 1,
        limit: 10
      });

      // Execute
      await service.getMediaAssets(filters, 1, 10);

      // Verify
      expect(mockMediaAssetRepository.findAll).toHaveBeenCalledWith({
        ...filters,
        page: 1,
        limit: 10
      });
    });
  });

  describe('getMediaAsset', () => {
    it('should return a media asset by ID', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);

      // Execute
      const result = await service.getMediaAsset(assetId);

      // Verify
      expect(result.id).toEqual(assetId);
      expect(mockMediaAssetRepository.findById).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      // Setup
      const assetId = 'nonexistent';
      mockMediaAssetRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getMediaAsset(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMediaAsset', () => {
    it('should update a media asset', async () => {
      // Setup
      const assetId = 'asset1';
      const updateDto = {
        filename: 'updated-name.jpg',
        altText: 'Updated Alt Text'
      };
      
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);
      mockMediaAssetRepository.update.mockResolvedValue({ 
        ...mockMediaAssets[0],
        ...updateDto,
        updatedAt: new Date() 
      });

      // Execute
      const result = await service.updateMediaAsset(assetId, updateDto);

      // Verify
      expect(result.filename).toEqual(updateDto.filename);
      expect(result.altText).toEqual(updateDto.altText);
      expect(mockMediaAssetRepository.findById).toHaveBeenCalledWith(assetId);
      expect(mockMediaAssetRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when asset not found', async () => {
      // Setup
      const assetId = 'nonexistent';
      mockMediaAssetRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.updateMediaAsset(assetId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMediaAsset', () => {
    it('should delete a media asset and its file', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);
      mockMediaAssetRepository.softDelete.mockResolvedValue(undefined);

      // Execute
      const result = await service.deleteMediaAsset(assetId);

      // Verify
      expect(result.success).toBe(true);
      expect(mockMediaAssetRepository.findById).toHaveBeenCalledWith(assetId);
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(mockMediaAssetRepository.softDelete).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      // Setup
      const assetId = 'nonexistent';
      mockMediaAssetRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.deleteMediaAsset(assetId)).rejects.toThrow(NotFoundException);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(mockMediaAssetRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should continue with database deletion even if file deletion fails', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Unlink error');
      });

      // Execute
      const result = await service.deleteMediaAsset(assetId);

      // Verify
      expect(result.success).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(mockMediaAssetRepository.softDelete).toHaveBeenCalledWith(assetId);
    });
  });

  describe('getPhysicalFilePath', () => {
    it('should return physical file path for a valid asset', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);

      // Execute
      const result = await service.getPhysicalFilePath(assetId);

      // Verify
      expect(result).toContain('2025/05/abc123.jpg');
      expect(mockMediaAssetRepository.findById).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      // Setup
      const assetId = 'nonexistent';
      mockMediaAssetRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getPhysicalFilePath(assetId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when file does not exist on disk', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Execute & Verify
      await expect(service.getPhysicalFilePath(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a signed URL for a valid asset', async () => {
      // Setup
      const assetId = 'asset1';
      mockMediaAssetRepository.findById.mockResolvedValue(mockMediaAssets[0]);

      // Execute
      const result = await service.getSignedUrl(assetId);

      // Verify
      expect(result.url).toBeDefined();
      expect(result.url).toContain(mockMediaAssets[0].filePath);
      expect(result.url).toContain('signature=');
      expect(result.url).toContain('expires=');
      expect(result.expires).toBeDefined();
      expect(mockMediaAssetRepository.findById).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when asset not found', async () => {
      // Setup
      const assetId = 'nonexistent';
      mockMediaAssetRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getSignedUrl(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature that has not expired', () => {
      // Setup
      const assetId = 'asset1';
      const futureTimestamp = Date.now() + 3600 * 1000; // 1 hour in the future
      const validSignature = Buffer.from(`${assetId}:${futureTimestamp}`).toString('base64');

      // Execute
      const result = service.verifySignature(assetId, validSignature, futureTimestamp);

      // Verify
      expect(result).toBe(true);
    });

    it('should return false for expired timestamp', () => {
      // Setup
      const assetId = 'asset1';
      const pastTimestamp = Date.now() - 3600 * 1000; // 1 hour in the past
      const validSignature = Buffer.from(`${assetId}:${pastTimestamp}`).toString('base64');

      // Execute
      const result = service.verifySignature(assetId, validSignature, pastTimestamp);

      // Verify
      expect(result).toBe(false);
    });

    it('should return false for invalid signature', () => {
      // Setup
      const assetId = 'asset1';
      const futureTimestamp = Date.now() + 3600 * 1000; // 1 hour in the future
      const invalidSignature = 'invalid-signature';

      // Execute
      const result = service.verifySignature(assetId, invalidSignature, futureTimestamp);

      // Verify
      expect(result).toBe(false);
    });
  });
});