import { Injectable, NotFoundException, BadRequestException, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { MediaAssetRepository } from '../repositories/media-asset.repository';
import { 
  MediaAssetDto, 
  CreateMediaAssetDto, 
  UpdateMediaAssetDto, 
  MediaAssetFilterDto,
  MediaAssetListDto,
  MediaType
} from '../dto/media.dto';

@Injectable()
export class MediaService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  
  constructor(
    private readonly mediaAssetRepository: MediaAssetRepository,
    private readonly configService: ConfigService
  ) {
    // Set up media upload configuration
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads/game';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB default
    
    // Configure allowed media types
    this.allowedMimeTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg',
      // Audio
      'audio/mpeg', 'audio/ogg', 'audio/wav',
      // Documents
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/markdown'
    ];
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }
  
  /**
   * Get all media assets with filtering and pagination
   * @param filterDto Media asset filter criteria
   * @returns List of media assets with pagination metadata
   */
  async findAll(filterDto: MediaAssetFilterDto): Promise<MediaAssetListDto> {
    const result = await this.mediaAssetRepository.findAll(filterDto);
    
    return {
      assets: result.assets.map(asset => this.mapEntityToDto(asset)),
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit
    };
  }
  
  /**
   * Get a media asset by ID
   * @param id Media asset ID
   * @returns Media asset DTO
   */
  async findById(id: string): Promise<MediaAssetDto> {
    const mediaAsset = await this.mediaAssetRepository.findById(id);
    
    if (!mediaAsset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    
    return this.mapEntityToDto(mediaAsset);
  }
  
  /**
   * Create a new media asset from file upload
   * @param file Uploaded file
   * @param userId User ID of uploader
   * @param createDto Additional asset metadata
   * @returns Created media asset
   */
  async create(
    file: Express.Multer.File,
    userId: string,
    createDto: CreateMediaAssetDto
  ): Promise<MediaAssetDto> {
    // Validate file
    this.validateFile(file);
    
    // Create unique filename
    const fileExt = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    
    // Calculate relative path for storage
    const relativeFilePath = this.getRelativeFilePath(uniqueFilename);
    const absoluteFilePath = path.join(this.uploadDir, relativeFilePath);
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(absoluteFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write file to disk
    try {
      fs.writeFileSync(absoluteFilePath, file.buffer);
    } catch (error) {
      throw new BadRequestException(`Failed to write file: ${error.message}`);
    }
    
    // Determine media type
    const mediaType = this.getMediaTypeFromMimeType(file.mimetype);
    
    // Create media asset record
    const mediaAsset = await this.mediaAssetRepository.create({
      filename: createDto.altText ? createDto.altText : file.originalname,
      filePath: `/media/${relativeFilePath}`, // Store as URL path
      mimeType: file.mimetype,
      fileSize: file.size,
      altText: createDto.altText,
      mediaType,
      category: createDto.category,
      sectionId: createDto.sectionId,
      moduleId: createDto.moduleId,
      createdBy: userId
    });
    
    return this.mapEntityToDto(mediaAsset);
  }
  
  /**
   * Update a media asset
   * @param id Media asset ID
   * @param updateDto Updated asset data
   * @returns Updated media asset
   */
  async update(id: string, updateDto: UpdateMediaAssetDto): Promise<MediaAssetDto> {
    const mediaAsset = await this.mediaAssetRepository.findById(id);
    
    if (!mediaAsset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    
    const updatedAsset = await this.mediaAssetRepository.update(id, {
      filename: updateDto.filename,
      altText: updateDto.altText,
      category: updateDto.category
    });
    
    return this.mapEntityToDto(updatedAsset);
  }
  
  /**
   * Delete a media asset
   * @param id Media asset ID
   * @returns Success status
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const mediaAsset = await this.mediaAssetRepository.findById(id);
    
    if (!mediaAsset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    
    // Delete file from disk
    try {
      const filePath = path.join(this.uploadDir, mediaAsset.filePath.replace('/media/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but continue with database deletion
      console.error(`Error deleting file: ${error.message}`);
    }
    
    // Soft delete record
    await this.mediaAssetRepository.softDelete(id);
    
    return { success: true };
  }
  
  /**
   * Bulk delete media assets
   * @param ids Array of media asset IDs
   * @returns Number of assets deleted
   */
  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    // Get all assets to delete
    const assets = await this.mediaAssetRepository.findByIds(ids);
    
    // Delete files from disk
    for (const asset of assets) {
      try {
        const filePath = path.join(this.uploadDir, asset.filePath.replace('/media/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // Log error but continue with database deletion
        console.error(`Error deleting file ${asset.filename}: ${error.message}`);
      }
    }
    
    // Soft delete records
    const count = await this.mediaAssetRepository.bulkSoftDelete(ids);
    
    return { count };
  }
  
  /**
   * Get all media assets for a specific section
   * @param sectionId Section ID
   * @returns Array of media assets
   */
  async findBySection(sectionId: string): Promise<MediaAssetDto[]> {
    const assets = await this.mediaAssetRepository.findBySection(sectionId);
    return assets.map(asset => this.mapEntityToDto(asset));
  }
  
  /**
   * Get all media assets for a specific module
   * @param moduleId Module ID
   * @returns Array of media assets
   */
  async findByModule(moduleId: string): Promise<MediaAssetDto[]> {
    const assets = await this.mediaAssetRepository.findByModule(moduleId);
    return assets.map(asset => this.mapEntityToDto(asset));
  }
  
  /**
   * Validate that file meets size and type restrictions
   * @param file File to validate
   * @private
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`
      );
    }
    
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }
  
  /**
   * Generate a relative file path for storing a file
   * @param filename Unique filename
   * @returns Relative file path organized by date
   * @private
   */
  private getRelativeFilePath(filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${year}/${month}/${filename}`;
  }
  
  /**
   * Map media entity to DTO
   * @param entity Media asset entity
   * @returns Media asset DTO
   * @private
   */
  private mapEntityToDto(entity: any): MediaAssetDto {
    return {
      id: entity.id,
      filename: entity.filename,
      filePath: entity.filePath,
      mimeType: entity.mimeType,
      fileSize: entity.fileSize,
      altText: entity.altText,
      mediaType: entity.mediaType,
      category: entity.category,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
  
  /**
   * Ensure upload directory exists
   * @private
   */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }
  
  /**
   * Determine media type from MIME type
   * @param mimeType MIME type
   * @returns Media type enum value
   * @private
   */
  private getMediaTypeFromMimeType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return MediaType.AUDIO;
    } else if (
      mimeType.startsWith('application/pdf') ||
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
      mimeType.startsWith('text/')
    ) {
      return MediaType.DOCUMENT;
    }
    return MediaType.OTHER;
  }

  /**
   * Upload a media asset
   * @param file Uploaded file
   * @param userId User ID of uploader
   * @param createDto Additional asset metadata
   * @returns Created media asset
   */
  async uploadMedia(
    file: Express.Multer.File,
    userId: string,
    createDto: Partial<CreateMediaAssetDto> = { filename: file?.originalname || 'unknown' }
  ): Promise<MediaAssetDto> {
    // Ensure we have a complete CreateMediaAssetDto
    const completeCreateDto: CreateMediaAssetDto = {
      filename: createDto.filename || file.originalname,
      ...createDto
    };
    return this.create(file, userId, completeCreateDto);
  }

  /**
   * Get media assets with pagination
   * @param filters Media asset filter criteria
   * @param page Page number
   * @param limit Items per page
   * @returns List of media assets with pagination metadata
   */
  async getMediaAssets(
    filters: MediaAssetFilterDto = {},
    page: number = 1,
    limit: number = 10
  ): Promise<MediaAssetListDto> {
    return this.findAll({
      ...filters,
      page,
      limit
    });
  }

  /**
   * Get a media asset by ID
   * @param id Media asset ID
   * @returns Media asset DTO
   */
  async getMediaAsset(id: string): Promise<MediaAssetDto> {
    return this.findById(id);
  }

  /**
   * Update a media asset
   * @param id Media asset ID
   * @param updateDto Updated asset data
   * @returns Updated media asset
   */
  async updateMediaAsset(id: string, updateDto: UpdateMediaAssetDto): Promise<MediaAssetDto> {
    return this.update(id, updateDto);
  }

  /**
   * Delete a media asset
   * @param id Media asset ID
   * @returns Success status
   */
  async deleteMediaAsset(id: string): Promise<{ success: boolean }> {
    return this.delete(id);
  }

  /**
   * Get physical file path for a media asset
   * @param id Media asset ID
   * @returns Absolute file path
   */
  async getPhysicalFilePath(id: string): Promise<string> {
    const mediaAsset = await this.mediaAssetRepository.findById(id);
    
    if (!mediaAsset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    
    const relativePath = mediaAsset.filePath.replace('/media/', '');
    const absolutePath = path.join(this.uploadDir, relativePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(`File for media asset ${id} not found on disk`);
    }
    
    return absolutePath;
  }

  /**
   * Get signed URL for a media asset
   * @param id Media asset ID
   * @param expiresInSeconds Time in seconds until URL expires
   * @returns Signed URL and expiry time
   */
  async getSignedUrl(id: string, expiresInSeconds: number = 3600): Promise<{ url: string; expires: Date }> {
    const mediaAsset = await this.mediaAssetRepository.findById(id);
    
    if (!mediaAsset) {
      throw new NotFoundException(`Media asset with ID ${id} not found`);
    }
    
    // Create signature that expires
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSeconds);
    
    // In a real app, you'd use a more secure signing mechanism
    const signature = Buffer.from(`${id}:${expires.getTime()}`).toString('base64');
    
    // Format URL with signature
    const url = `${mediaAsset.filePath}?signature=${signature}&expires=${expires.getTime()}`;
    
    return {
      url,
      expires
    };
  }

  /**
   * Verify signature for a media asset URL
   * @param id Media asset ID
   * @param signature URL signature
   * @param expires Expiry timestamp
   * @returns Whether signature is valid
   */
  verifySignature(id: string, signature: string, expires: number): boolean {
    // In a real app, you'd use a more secure verification mechanism
    
    // Check if URL has expired
    if (expires < Date.now()) {
      return false;
    }
    
    // Verify signature (simplified for demo)
    const expectedSignature = Buffer.from(`${id}:${expires}`).toString('base64');
    return signature === expectedSignature;
  }

  /**
   * Get media usage statistics
   * @returns Media statistics
   */
  async getMediaStatistics(): Promise<any> {
    const stats = await this.mediaAssetRepository.getStatistics();
    
    return {
      totalCount: stats.totalCount || 0,
      totalSize: stats.totalSize || 0,
      byType: {
        image: stats.imageCount || 0,
        video: stats.videoCount || 0,
        audio: stats.audioCount || 0,
        document: stats.documentCount || 0,
        other: stats.otherCount || 0
      }
    };
  }
}