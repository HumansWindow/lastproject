import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionContent } from '../entities/section-content.entity';
import { GameSection } from '../entities/game-section.entity';
import { MediaAssetEntity } from '../entities/media-asset.entity';
import { SectionContentType } from '../interfaces/content-types.interface';
import { 
  SectionContentDto, 
  SectionContentItemDto,
  MediaAssetReferenceDto
} from '../dto/section.dto';
import { CreateSectionContentDto, UpdateSectionContentDto } from '../dto/section-content.dto';
import { UserProgressService } from './user-progress.service';
import { CheckpointCompletionDto } from '../dto/progress.dto';
import { SectionCheckpoint } from '../entities/section-checkpoint.entity';
import { SectionContentRepository } from '../repositories/section-content.repository';
import { ContentTemplateService } from './content-template.service';
import { ContentVersionRepository } from '../repositories/content-version.repository';
import { User } from '../../users/entities/user.entity';
import { ContentStatisticsDto } from '../dto/content-statistics.dto';
import { GameSectionsService } from './game-sections.service';
import { MediaService } from './media.service';

// Type alias for clarity - SectionContentEntity is actually SectionContent
type SectionContentEntity = SectionContent;

@Injectable()
export class SectionContentService {
  private readonly logger = new Logger(SectionContentService.name);
  private readonly contentCache = new Map<string, { content: SectionContentDto[], timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private readonly contentRepository: SectionContentRepository,
    private readonly contentVersionRepository: ContentVersionRepository,
    private readonly contentTemplateService: ContentTemplateService,
    private readonly sectionsService: GameSectionsService,
    private readonly mediaService: MediaService,
    @InjectRepository(SectionContent)
    private readonly sectionContentRepository: Repository<SectionContent>,
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>,
    @InjectRepository(MediaAssetEntity)
    private readonly mediaAssetRepository: Repository<MediaAssetEntity>,
    @InjectRepository(SectionCheckpoint)
    private readonly checkpointRepository: Repository<SectionCheckpoint>,
    private readonly userProgressService: UserProgressService
  ) {}

  /**
   * Get content for a section with caching
   * @param sectionId Section ID
   * @returns Promise with array of section content DTOs
   */
  async getSectionContent(sectionId: string): Promise<SectionContentDto[]> {
    // Try to get from cache first
    const cachedContent = this.contentCache.get(sectionId);
    if (cachedContent && (Date.now() - cachedContent.timestamp) < this.cacheTTL) {
      return cachedContent.content;
    }
    
    // If not in cache or expired, fetch from repository
    const contentEntities = await this.contentRepository.findBySectionId(sectionId);
    const contentDtos = contentEntities.map(entity => this.mapEntityToDto(entity));
    
    // Update cache
    this.contentCache.set(sectionId, {
      content: contentDtos,
      timestamp: Date.now()
    });
    
    return contentDtos;
  }

  /**
   * Create content for a section
   * @param createDto DTO with content data
   * @param user User who is creating the content
   * @returns Promise with created content DTO
   */
  async createSectionContent(
    createDto: CreateSectionContentDto,
    user?: User,
  ): Promise<SectionContentDto> {
    // Verify section exists
    await this.sectionsService.getSectionById(createDto.sectionId);
    
    // Validate the content based on content type
    this.contentTemplateService.validateContentByType(createDto.contentType, createDto.content);
    
    // Handle template-based content creation
    if (createDto.templateId) {
      createDto.content = await this.contentTemplateService.createContentFromTemplate(
        createDto.templateId,
        createDto.content || {},
      );
    }
    
    // Process any media assets in the content
    const processedContent = await this.processMediaReferences(createDto.content);
    
    // Get highest order index and add 1 for new content item if not specified
    let orderIndex = createDto.orderIndex;
    if (orderIndex === undefined) {
      const lastContent = await this.sectionContentRepository.findOne({
        where: { sectionId: createDto.sectionId },
        order: { orderIndex: 'DESC' }
      });
      
      orderIndex = lastContent ? lastContent.orderIndex + 1 : 0;
    }
    
    // Create content entity
    const content = this.sectionContentRepository.create({
      sectionId: createDto.sectionId,
      contentType: createDto.contentType,
      content: processedContent,
      orderIndex: orderIndex
    });
    
    const savedContent = await this.sectionContentRepository.save(content);
    
    // Create a version record for this content
    await this.contentVersionRepository.createVersion(
      savedContent.id,
      savedContent.content,
      user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'system',
      'Initial version',
    );
    
    // Invalidate cache for this section
    this.contentCache.delete(createDto.sectionId);
    
    return this.mapEntityToDto(savedContent);
  }

  /**
   * Update section content
   * @param contentId Content item ID
   * @param updateDto DTO with content data to update
   * @param user Optional user who is updating the content
   * @param changeDescription Optional description of the changes
   * @returns Promise with updated content DTO
   */
  async updateSectionContent(
    contentId: string, 
    updateDto: UpdateSectionContentDto,
    user?: User,
    changeDescription?: string
  ): Promise<SectionContentDto> {
    // Find existing content
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Validate content based on its type
    if (content.contentType) {
      this.contentTemplateService.validateContentByType(
        content.contentType, 
        { ...content.content, ...updateDto.content }
      );
    }
    
    // Store the original content for versioning
    const originalContent = { ...content.content };
    
    // Update the content
    const updatedContent = await this.contentRepository.update(contentId, updateDto);
    
    // Create a new version record
    await this.contentVersionRepository.createVersion(
      contentId,
      originalContent,
      user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'system',
      changeDescription || 'Content updated',
    );
    
    // Invalidate cache for this section
    this.contentCache.delete(content.sectionId);
    
    return this.mapEntityToDto(updatedContent);
  }

  /**
   * Delete section content
   * @param contentId Content item ID
   */
  async removeSectionContent(contentId: string): Promise<void> {
    const content = await this.sectionContentRepository.findOne({ 
      where: { id: contentId } 
    });
    
    if (!content) {
      throw new NotFoundException(`Section content with ID ${contentId} not found`);
    }
    
    const sectionId = content.sectionId;
    
    await this.sectionContentRepository.remove(content);
    
    // Invalidate cache for this section
    this.contentCache.delete(sectionId);
  }

  /**
   * Reorder section content items
   * @param sectionId Section ID
   * @param contentIds Array of content IDs in the desired order
   * @returns Promise with updated content array
   */
  async reorderSectionContent(
    sectionId: string, 
    contentIds: string[]
  ): Promise<SectionContentDto[]> {
    // Verify section exists
    const sectionExists = await this.gameSectionRepository.count({ 
      where: { id: sectionId } 
    });
    
    if (!sectionExists) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Verify all content IDs belong to the section
    const content = await this.sectionContentRepository.find({ 
      where: { sectionId: sectionId } 
    });
    
    const contentIdSet = new Set(content.map(item => item.id));
    const invalidIds = contentIds.filter(id => !contentIdSet.has(id));
    
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `The following content IDs do not belong to section ${sectionId}: ${invalidIds.join(', ')}`
      );
    }
    
    // Update order indices
    await Promise.all(contentIds.map(async (id, index) => {
      await this.sectionContentRepository.update(id, { orderIndex: index });
    }));
    
    // Invalidate cache for this section
    this.contentCache.delete(sectionId);
    
    // Return updated content
    return this.getSectionContent(sectionId);
  }

  /**
   * Clear the content cache for all sections or a specific section
   * @param sectionId Optional section ID to clear cache for
   */
  clearContentCache(sectionId?: string): void {
    if (sectionId) {
      this.contentCache.delete(sectionId);
      this.logger.debug(`Cleared content cache for section ${sectionId}`);
    } else {
      this.contentCache.clear();
      this.logger.debug('Cleared entire content cache');
    }
  }

  /**
   * Get a content item by ID
   * @param contentId Content item ID
   * @returns Promise with content DTO
   */
  async getContentById(contentId: string): Promise<SectionContentDto> {
    const content = await this.sectionContentRepository.findOne({ 
      where: { id: contentId } 
    });
    
    if (!content) {
      throw new NotFoundException(`Section content with ID ${contentId} not found`);
    }
    
    return {
      id: content.id,
      sectionId: content.sectionId,
      contentType: content.contentType as SectionContentType,
      content: content.content,
      orderIndex: content.orderIndex
    };
  }

  /**
   * Validate content based on content type
   * @param contentType Content type
   * @param content Content data
   */
  private validateContent(contentType: string, content: any): void {
    // Validate content structure based on type
    switch (contentType) {
      case SectionContentType.HEADING:
        if (!content.text) {
          throw new BadRequestException('Heading content must include text');
        }
        if (!content.level || content.level < 1 || content.level > 6) {
          throw new BadRequestException('Heading level must be between 1 and 6');
        }
        break;
        
      case SectionContentType.TEXT:
        if (!content.text) {
          throw new BadRequestException('Text content must include text');
        }
        break;
        
      case SectionContentType.IMAGE:
        if (!content.url && !content.assetId) {
          throw new BadRequestException('Image content must include URL or asset ID');
        }
        break;
        
      case SectionContentType.VIDEO:
        if (!content.url && !content.assetId && !content.externalUrl) {
          throw new BadRequestException('Video content must include URL, asset ID, or external URL');
        }
        break;
        
      case SectionContentType.CARD:
        if (!content.title) {
          throw new BadRequestException('Card content must include title');
        }
        if (!content.body) {
          throw new BadRequestException('Card content must include body');
        }
        break;
        
      case SectionContentType.TIMELINE_ITEM:
        if (!content.title) {
          throw new BadRequestException('Timeline item must include title');
        }
        if (!content.date) {
          throw new BadRequestException('Timeline item must include date');
        }
        break;
        
      case SectionContentType.QUIZ_QUESTION:
        if (!content.questionText) {
          throw new BadRequestException('Quiz question must include question text');
        }
        if (!content.questionType) {
          throw new BadRequestException('Quiz question must include question type');
        }
        if (content.questionType === 'multiple-choice' && (!content.options || !content.options.length)) {
          throw new BadRequestException('Multiple choice questions must include options');
        }
        if (content.correctAnswer === undefined) {
          throw new BadRequestException('Quiz question must include correct answer');
        }
        break;
        
      case SectionContentType.INTERACTIVE_ELEMENT:
        if (!content.elementType) {
          throw new BadRequestException('Interactive element must include element type');
        }
        if (!content.data) {
          throw new BadRequestException('Interactive element must include data');
        }
        break;
    }
  }

  /**
   * Process media asset references in content
   * @param content Content data
   * @returns Processed content with validated asset references
   */
  private async processMediaReferences(content: any): Promise<any> {
    if (!content) return content;
    
    const newContent = { ...content };
    
    // Process assetId references
    if (newContent.assetId) {
      const asset = await this.mediaAssetRepository.findOne({ 
        where: { id: newContent.assetId } 
      });
      
      if (!asset) {
        throw new NotFoundException(`Media asset with ID ${newContent.assetId} not found`);
      }
      
      // Add the URL from the media asset
      newContent.url = asset.filePath;
    }
    
    // Process any nested objects in the content
    for (const key in newContent) {
      if (typeof newContent[key] === 'object' && newContent[key] !== null) {
        newContent[key] = await this.processMediaReferences(newContent[key]);
      }
    }
    
    return newContent;
  }

  /**
   * Track user's interaction with section content
   * @param userId User ID
   * @param sectionId Section ID
   * @param contentId Content ID
   * @param timeSpent Time spent on content in seconds
   * @returns Promise with success status
   */
  async trackContentInteraction(
    userId: string,
    sectionId: string,
    contentId: string,
    timeSpent: number
  ): Promise<{ success: boolean }> {
    // Verify content exists
    const content = await this.sectionContentRepository.findOne({
      where: { id: contentId, sectionId: sectionId }
    });

    if (!content) {
      throw new NotFoundException(`Section content with ID ${contentId} not found in section ${sectionId}`);
    }

    // Create checkpoint data for this content interaction
    const checkpointDto: CheckpointCompletionDto = {
      sectionId,
      checkpointType: `content-${content.contentType}`,
      contentId,
      isCompleted: true,
      timeSpent,
      responses: {
        contentId,
        contentType: content.contentType,
        action: 'viewed'
      }
    };

    // Pass to user progress service to record the checkpoint
    return this.userProgressService.completeCheckpoint(userId, checkpointDto);
  }

  /**
   * Get all text-image content types for a section with user progress indicators
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with content items and their viewed status
   */
  async getSectionContentWithProgress(
    userId: string,
    sectionId: string
  ): Promise<Array<SectionContentDto & { viewed: boolean }>> {
    // Get all content for the section
    const contentItems = await this.getSectionContent(sectionId);
    
    // Get user progress for this section to check viewed content
    const sectionProgress = await this.userProgressService.getSectionProgress(userId, sectionId);
    
    // Get checkpoints for this progress to see which content items have been viewed
    const checkpoints = await this.checkpointRepository.find({
      where: {
        progressId: sectionProgress.id
      }
    });

    // Map content items with viewed status
    return contentItems.map(item => {
      const isViewed = checkpoints.some(cp => {
        try {
          // Check if responses contains this content ID
          const responses = typeof cp.responses === 'string' ? 
            JSON.parse(cp.responses) : cp.responses;
          
          return responses && responses.contentId === item.id;
        } catch {
          return false;
        }
      });

      return {
        ...item,
        viewed: isViewed
      };
    });
  }

  /**
   * Mark all content in a section as viewed (for quick completion)
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with success status
   */
  async markAllContentViewed(
    userId: string,
    sectionId: string
  ): Promise<{ success: boolean; contentCount: number }> {
    // Get all content for the section
    const contentItems = await this.getSectionContent(sectionId);
    
    if (contentItems.length === 0) {
      return { success: true, contentCount: 0 };
    }

    // Track each content item as viewed
    const trackPromises = contentItems.map(item => 
      this.trackContentInteraction(userId, sectionId, item.id, 5) // Default time spent
    );

    await Promise.all(trackPromises);

    return { 
      success: true,
      contentCount: contentItems.length
    };
  }

  /**
   * Get content progress statistics for a section
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with progress statistics
   */
  async getContentProgressStats(
    userId: string,
    sectionId: string
  ): Promise<{ total: number; viewed: number; percentage: number }> {
    // Get content with progress
    const contentWithProgress = await this.getSectionContentWithProgress(userId, sectionId);
    
    const total = contentWithProgress.length;
    const viewed = contentWithProgress.filter(item => item.viewed).length;
    const percentage = total > 0 ? Math.floor((viewed / total) * 100) : 0;

    return {
      total,
      viewed,
      percentage
    };
  }

  async deleteSectionContent(contentId: string): Promise<boolean> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }
    
    const sectionId = content.sectionId;
    const result = await this.contentRepository.delete(contentId);
    
    // Delete all version history for this content
    await this.contentVersionRepository.deleteVersionsForContent(contentId);
    
    // Invalidate cache for this section
    this.contentCache.delete(sectionId);
    
    return result;
  }

  async getFilteredSectionContent(
    sectionId?: string,
    contentType?: string,
  ): Promise<SectionContentDto[]> {
    const contentEntities = await this.contentRepository.findFiltered(sectionId, contentType);
    return contentEntities.map(entity => this.mapEntityToDto(entity));
  }

  async getContentVersionHistory(contentId: string): Promise<any[]> {
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }
    
    const versions = await this.contentVersionRepository.getVersionHistory(contentId);
    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      changedBy: version.changedBy,
      changeDescription: version.changeDescription,
      createdAt: version.createdAt,
    }));
  }

  async revertToVersion(contentId: string, versionId: string): Promise<SectionContentDto> {
    // Verify content exists
    const content = await this.contentRepository.findById(contentId);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }
    
    // Get the version to revert to
    const version = await this.contentVersionRepository.getVersion(versionId);
    if (!version || version.contentId !== contentId) {
      throw new NotFoundException(`Version with ID ${versionId} not found for content ${contentId}`);
    }
    
    // Create a new version with current content before reverting
    await this.contentVersionRepository.createVersion(
      contentId,
      content.content,
      'system',
      `Auto-saved before reverting to version ${version.versionNumber}`,
    );
    
    // Update content with version data
    const updatedContent = await this.contentRepository.update(contentId, {
      content: version.contentData,
    });
    
    // Invalidate cache for this section
    this.contentCache.delete(content.sectionId);
    
    return this.mapEntityToDto(updatedContent);
  }

  async clearCache(sectionId?: string): Promise<{ success: boolean; message: string }> {
    if (sectionId) {
      // Clear cache for specific section
      this.contentCache.delete(sectionId);
      return { success: true, message: `Cache cleared for section ${sectionId}` };
    } else {
      // Clear all cache
      this.contentCache.clear();
      return { success: true, message: 'All section content cache cleared' };
    }
  }

  async getContentStatistics(): Promise<ContentStatisticsDto> {
    // Get counts and statistics from repository
    const totalContent = await this.contentRepository.countAll();
    const totalSections = await this.sectionsService.countSections();
    const totalModules = await this.sectionsService.countModules();
    const contentByType = await this.contentRepository.getContentTypeStatistics();
    const moduleStatistics = await this.sectionsService.getModuleStatistics();
    const mediaStats = await this.mediaService.getMediaStatistics();
    const viewStats = await this.contentRepository.getViewStatistics();
    
    return {
      totalModules,
      totalSections,
      totalContent,
      totalMediaAssets: mediaStats.totalAssets,
      averageModuleCompletionRate: moduleStatistics.averageCompletionRate,
      totalUniqueUsers: moduleStatistics.uniqueUsers,
      contentByType,
      moduleStatistics: moduleStatistics.modules,
      mostViewedContentId: viewStats.mostViewed?.id || '',
      mostViewedContentTitle: viewStats.mostViewed?.title || '',
      mostViewedContentCount: viewStats.mostViewed?.viewCount || 0,
      leastViewedContentId: viewStats.leastViewed?.id || '',
      leastViewedContentTitle: viewStats.leastViewed?.title || '',
      leastViewedContentCount: viewStats.leastViewed?.viewCount || 0,
      highestEngagementContentId: viewStats.highestEngagement?.id || '',
      highestEngagementContentTitle: viewStats.highestEngagement?.title || '',
      highestEngagementTime: viewStats.highestEngagement?.averageTimeSpent || 0,
    };
  }

  async bulkImportContent(contentItems: CreateSectionContentDto[]): Promise<{ 
    success: boolean;
    imported: number; 
    failed: number; 
    errors: any[];
  }> {
    const results = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
    };
    
    for (const item of contentItems) {
      try {
        await this.createSectionContent(item);
        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          item,
          error: error.message,
        });
      }
    }
    
    results.success = results.failed === 0;
    return results;
  }

  async bulkExportContent(sectionId?: string, moduleId?: string): Promise<{
    exportedAt: Date;
    count: number;
    content: any[];
  }> {
    let contentEntities: SectionContentEntity[] = [];
    
    if (sectionId) {
      contentEntities = await this.contentRepository.findBySectionId(sectionId);
    } else if (moduleId) {
      const sections = await this.sectionsService.getSectionsByModuleId(moduleId);
      for (const section of sections) {
        const sectionContent = await this.contentRepository.findBySectionId(section.id);
        contentEntities = contentEntities.concat(sectionContent);
      }
    } else {
      contentEntities = await this.contentRepository.findAll();
    }
    
    return {
      exportedAt: new Date(),
      count: contentEntities.length,
      content: contentEntities.map(entity => ({
        id: entity.id,
        sectionId: entity.sectionId,
        contentType: entity.contentType,
        content: entity.content,
        orderIndex: entity.orderIndex,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      })),
    };
  }

  private mapEntityToDto(entity: SectionContentEntity): SectionContentDto {
    return {
      id: entity.id,
      sectionId: entity.sectionId,
      contentType: entity.contentType,
      content: entity.content,
      orderIndex: entity.orderIndex,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}