import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { MediaAssetEntity } from '../entities/media-asset.entity';
import { MediaAssetFilterDto, MediaType, MediaCategory } from '../dto/media.dto';

@Injectable()
export class MediaAssetRepository {
  constructor(
    @InjectRepository(MediaAssetEntity)
    private readonly repository: Repository<MediaAssetEntity>
  ) {}

  /**
   * Find all media assets with optional filtering and pagination
   * @param filterDto Filter and pagination parameters
   * @returns List of media assets and total count
   */
  async findAll(filterDto: MediaAssetFilterDto): Promise<{
    assets: MediaAssetEntity[];
    totalCount: number;
    page: number;
    limit: number;
  }> {
    const { mediaType, category, search, sectionId, moduleId, page = 1, limit = 10 } = filterDto;
    
    // Build query with filters
    const whereClause: FindOptionsWhere<MediaAssetEntity> = {};
    
    if (mediaType) {
      whereClause.mediaType = mediaType;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause.filename = ILike(`%${search}%`);
    }
    
    if (sectionId) {
      whereClause.sectionId = sectionId;
    }
    
    if (moduleId) {
      whereClause.moduleId = moduleId;
    }
    
    // Execute query with pagination
    const [assets, totalCount] = await this.repository.findAndCount({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC'
      }
    });
    
    return {
      assets,
      totalCount,
      page,
      limit
    };
  }

  /**
   * Find a media asset by ID
   * @param id Media asset ID
   * @returns Media asset entity or null if not found
   */
  async findById(id: string): Promise<MediaAssetEntity | null> {
    return this.repository.findOne({
      where: { id }
    });
  }

  /**
   * Find multiple media assets by their IDs
   * @param ids Array of media asset IDs
   * @returns Array of media asset entities
   */
  async findByIds(ids: string[]): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) }
    });
  }

  /**
   * Find all media assets associated with a section
   * @param sectionId Section ID
   * @returns Array of media asset entities
   */
  async findBySection(sectionId: string): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: { sectionId },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Find all media assets associated with a module
   * @param moduleId Module ID
   * @returns Array of media asset entities
   */
  async findByModule(moduleId: string): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: { moduleId },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Find media assets by type
   * @param mediaType Media type
   * @returns Array of media asset entities
   */
  async findByType(mediaType: MediaType): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: { mediaType },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Find media assets by category
   * @param category Media category
   * @returns Array of media asset entities
   */
  async findByCategory(category: MediaCategory): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: { category },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Create a new media asset
   * @param mediaAssetData Media asset data
   * @returns Created media asset entity
   */
  async create(mediaAssetData: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const mediaAsset = this.repository.create(mediaAssetData);
    return this.repository.save(mediaAsset);
  }

  /**
   * Update a media asset
   * @param id Media asset ID
   * @param mediaAssetData Updated media asset data
   * @returns Updated media asset entity
   */
  async update(id: string, mediaAssetData: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    await this.repository.update(id, mediaAssetData);
    return this.findById(id);
  }

  /**
   * Soft delete a media asset
   * @param id Media asset ID
   * @returns Deleted media asset
   */
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Hard delete a media asset (for testing purposes only)
   * @param id Media asset ID
   */
  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Bulk soft delete multiple media assets
   * @param ids Array of media asset IDs
   * @returns Number of deleted assets
   */
  async bulkSoftDelete(ids: string[]): Promise<number> {
    const result = await this.repository.softDelete({
      id: In(ids)
    });
    return result.affected || 0;
  }

  /**
   * Search media assets by filename
   * @param searchTerm Search term
   * @param limit Maximum number of results to return
   * @returns Array of matching media assets
   */
  async searchByFilename(searchTerm: string, limit: number = 10): Promise<MediaAssetEntity[]> {
    return this.repository.find({
      where: {
        filename: ILike(`%${searchTerm}%`)
      },
      take: limit,
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Get statistics about media assets
   * @returns Statistics about media assets
   */
  async getStatistics(): Promise<{
    totalCount: number;
    totalSize: number;
    imageCount: number;
    videoCount: number;
    audioCount: number;
    documentCount: number;
    otherCount: number;
  }> {
    const allAssets = await this.repository.find();
    
    return {
      totalCount: allAssets.length,
      totalSize: allAssets.reduce((sum, asset) => sum + (asset.fileSize || 0), 0),
      imageCount: allAssets.filter(asset => asset.mediaType === MediaType.IMAGE).length,
      videoCount: allAssets.filter(asset => asset.mediaType === MediaType.VIDEO).length,
      audioCount: allAssets.filter(asset => asset.mediaType === MediaType.AUDIO).length,
      documentCount: allAssets.filter(asset => asset.mediaType === MediaType.DOCUMENT).length,
      otherCount: allAssets.filter(asset => asset.mediaType === MediaType.OTHER).length
    };
  }
}