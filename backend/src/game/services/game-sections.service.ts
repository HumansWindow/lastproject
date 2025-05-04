import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSection } from '../entities/game-section.entity';
import { SectionContent } from '../entities/section-content.entity';
import { GameModule } from '../entities/game-module.entity';
import { 
  GameSectionDto, 
  GameSectionListDto, 
  CreateGameSectionDto, 
  UpdateGameSectionDto,
  SectionContentDto,
  CreateSectionContentDto,
  UpdateSectionContentDto,
  SectionWithContentDto,
  SectionType,
  BackgroundType
} from '../dto/section.dto';
import { SectionContentType } from '../interfaces/content-types.interface';
import { SectionConfigInterface } from '../interfaces/section-config.interface';

@Injectable()
export class GameSectionsService {
  constructor(
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>,
    @InjectRepository(SectionContent)
    private readonly sectionContentRepository: Repository<SectionContent>,
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>
  ) {}

  /**
   * Find all sections for a module
   * @param moduleId Module ID
   * @param active Optional filter for active sections only
   * @returns Promise with section list DTO
   */
  async findAllByModule(moduleId: string, active?: boolean): Promise<GameSectionListDto> {
    // Verify module exists
    const moduleExists = await this.gameModuleRepository.count({ where: { id: moduleId } });
    if (!moduleExists) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    const query = this.gameSectionRepository.createQueryBuilder('section')
      .where('section.moduleId = :moduleId', { moduleId })
      .orderBy('section.orderIndex', 'ASC');
    
    if (active !== undefined) {
      query.andWhere('section.isActive = :active', { active });
    }
    
    const sections = await query.getMany();
    const totalCount = await query.getCount();
    
    return {
      moduleId,
      sections: sections.map(section => this.mapToDto(section)),
      totalCount
    };
  }

  /**
   * Find a section by ID
   * @param id Section ID
   * @returns Promise with section DTO
   */
  async findOne(id: string): Promise<GameSectionDto> {
    const section = await this.gameSectionRepository.findOne({ 
      where: { id },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${id} not found`);
    }
    
    return this.mapToDto(section);
  }

  /**
   * Find a section with all its content
   * @param id Section ID
   * @returns Promise with section with content DTO
   */
  async findWithContent(id: string): Promise<SectionWithContentDto> {
    const section = await this.gameSectionRepository.findOne({ 
      where: { id },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${id} not found`);
    }
    
    const contentItems = await this.sectionContentRepository.find({
      where: { sectionId: id },
      order: { orderIndex: 'ASC' }
    });
    
    return {
      ...this.mapToDto(section),
      content: contentItems.map(item => ({
        id: item.id,
        contentType: item.contentType as SectionContentType,
        content: item.content,
        orderIndex: item.orderIndex
      }))
    };
  }

  /**
   * Create a new section
   * @param createDto DTO with section data
   * @returns Promise with created section DTO
   */
  async create(createDto: CreateGameSectionDto): Promise<GameSectionDto> {
    // Verify module exists
    const moduleExists = await this.gameModuleRepository.findOne({ 
      where: { id: createDto.moduleId } 
    });
    
    if (!moduleExists) {
      throw new NotFoundException(`Game module with ID ${createDto.moduleId} not found`);
    }
    
    // Get highest order index in this module and add 1 for new section
    let orderIndex = createDto.orderIndex;
    if (orderIndex === undefined) {
      const lastSection = await this.gameSectionRepository.findOne({
        where: { moduleId: createDto.moduleId },
        order: { orderIndex: 'DESC' }
      });
      
      orderIndex = lastSection ? lastSection.orderIndex + 1 : 0;
    }
    
    const section = this.gameSectionRepository.create({
      moduleId: createDto.moduleId,
      title: createDto.title,
      sectionType: createDto.sectionType,
      orderIndex: orderIndex,
      backgroundType: createDto.backgroundType || BackgroundType.DEFAULT,
      configuration: createDto.configuration || {},
      isActive: createDto.isActive ?? true,
      waitTimeHours: createDto.waitTimeHours ?? 0
    });
    
    const savedSection = await this.gameSectionRepository.save(section);
    
    // If initial content was provided, create it
    if (createDto.initialContent && createDto.initialContent.length > 0) {
      await Promise.all(createDto.initialContent.map(async (contentDto, index) => {
        const content = this.sectionContentRepository.create({
          sectionId: savedSection.id,
          contentType: contentDto.contentType,
          content: contentDto.content,
          orderIndex: contentDto.orderIndex !== undefined ? contentDto.orderIndex : index
        });
        
        await this.sectionContentRepository.save(content);
      }));
    }
    
    return this.mapToDto(savedSection);
  }

  /**
   * Update an existing section
   * @param id Section ID
   * @param updateDto DTO with section data to update
   * @returns Promise with updated section DTO
   */
  async update(id: string, updateDto: UpdateGameSectionDto): Promise<GameSectionDto> {
    const section = await this.gameSectionRepository.findOne({ where: { id } });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${id} not found`);
    }
    
    // If changing module, verify new module exists
    if (updateDto.moduleId && updateDto.moduleId !== section.moduleId) {
      const newModuleExists = await this.gameModuleRepository.count({ 
        where: { id: updateDto.moduleId } 
      });
      
      if (!newModuleExists) {
        throw new NotFoundException(`Game module with ID ${updateDto.moduleId} not found`);
      }
    }
    
    // Update section properties
    if (updateDto.moduleId !== undefined) section.moduleId = updateDto.moduleId;
    if (updateDto.title !== undefined) section.title = updateDto.title;
    if (updateDto.sectionType !== undefined) section.sectionType = updateDto.sectionType;
    if (updateDto.orderIndex !== undefined) section.orderIndex = updateDto.orderIndex;
    if (updateDto.backgroundType !== undefined) section.backgroundType = updateDto.backgroundType;
    if (updateDto.configuration !== undefined) section.configuration = updateDto.configuration;
    if (updateDto.isActive !== undefined) section.isActive = updateDto.isActive;
    if (updateDto.waitTimeHours !== undefined) section.waitTimeHours = updateDto.waitTimeHours;
    
    section.updatedAt = new Date();
    const savedSection = await this.gameSectionRepository.save(section);
    return this.mapToDto(savedSection);
  }

  /**
   * Delete a section
   * @param id Section ID
   */
  async remove(id: string): Promise<void> {
    const section = await this.gameSectionRepository.findOne({ 
      where: { id },
      relations: ['contents']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${id} not found`);
    }
    
    // First remove all section content
    if (section.contents && section.contents.length > 0) {
      await this.sectionContentRepository.remove(section.contents);
    }
    
    // Then remove the section itself
    await this.gameSectionRepository.remove(section);
  }

  /**
   * Get content for a section
   * @param sectionId Section ID
   * @returns Promise with array of section content DTOs
   */
  async getSectionContent(sectionId: string): Promise<SectionContentDto[]> {
    const sectionExists = await this.gameSectionRepository.count({ 
      where: { id: sectionId } 
    });
    
    if (!sectionExists) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    const content = await this.sectionContentRepository.find({
      where: { sectionId: sectionId },
      order: { orderIndex: 'ASC' }
    });
    
    return content.map(item => ({
      id: item.id,
      sectionId: item.sectionId,
      contentType: item.contentType as SectionContentType,
      content: item.content,
      orderIndex: item.orderIndex
    }));
  }

  /**
   * Create content for a section
   * @param sectionId Section ID
   * @param createDto DTO with content data
   * @returns Promise with created content DTO
   */
  async createSectionContent(
    sectionId: string, 
    createDto: CreateSectionContentDto
  ): Promise<SectionContentDto> {
    const sectionExists = await this.gameSectionRepository.count({ 
      where: { id: sectionId } 
    });
    
    if (!sectionExists) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get highest order index and add 1 for new content item
    let orderIndex = createDto.orderIndex;
    if (orderIndex === undefined) {
      const lastContent = await this.sectionContentRepository.findOne({
        where: { sectionId: sectionId },
        order: { orderIndex: 'DESC' }
      });
      
      orderIndex = lastContent ? lastContent.orderIndex + 1 : 0;
    }
    
    const content = this.sectionContentRepository.create({
      sectionId: sectionId,
      contentType: createDto.contentType,
      content: createDto.content,
      orderIndex: orderIndex
    });
    
    const savedContent = await this.sectionContentRepository.save(content);
    
    return {
      id: savedContent.id,
      sectionId: savedContent.sectionId,
      contentType: savedContent.contentType as SectionContentType,
      content: savedContent.content,
      orderIndex: savedContent.orderIndex
    };
  }

  /**
   * Update section content
   * @param contentId Content item ID
   * @param updateDto DTO with content data to update
   * @returns Promise with updated content DTO
   */
  async updateSectionContent(
    contentId: string, 
    updateDto: UpdateSectionContentDto
  ): Promise<SectionContentDto> {
    const content = await this.sectionContentRepository.findOne({ 
      where: { id: contentId } 
    });
    
    if (!content) {
      throw new NotFoundException(`Section content with ID ${contentId} not found`);
    }
    
    // Update content properties
    if (updateDto.contentType !== undefined) content.contentType = updateDto.contentType;
    if (updateDto.content !== undefined) content.content = updateDto.content;
    if (updateDto.orderIndex !== undefined) content.orderIndex = updateDto.orderIndex;
    
    const savedContent = await this.sectionContentRepository.save(content);
    
    return {
      id: savedContent.id,
      sectionId: savedContent.sectionId,
      contentType: savedContent.contentType as SectionContentType,
      content: savedContent.content,
      orderIndex: savedContent.orderIndex
    };
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
    
    await this.sectionContentRepository.remove(content);
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
    
    // Return updated content
    return this.getSectionContent(sectionId);
  }

  /**
   * Find the previous section in a module
   * @param moduleId Module ID
   * @param currentOrderIndex Current section's order index
   * @returns Promise with previous section or null if none
   */
  async findPreviousInModule(
    moduleId: string, 
    currentOrderIndex: number
  ): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: {
        moduleId: moduleId,
        orderIndex: currentOrderIndex - 1,
        isActive: true
      }
    });
  }

  /**
   * Find the next section in a module
   * @param moduleId Module ID
   * @param currentOrderIndex Current section's order index
   * @returns Promise with next section or null if none
   */
  async findNextInModule(
    moduleId: string, 
    currentOrderIndex: number
  ): Promise<GameSection | null> {
    return this.gameSectionRepository.findOne({
      where: {
        moduleId: moduleId,
        orderIndex: currentOrderIndex + 1,
        isActive: true
      }
    });
  }

  /**
   * Map entity to DTO
   * @param section Game section entity
   * @returns Game section DTO
   */
  public mapToDto(section: GameSection): GameSectionDto {
    return {
      id: section.id,
      moduleId: section.moduleId,
      moduleName: section.module?.title,
      title: section.title,
      sectionType: section.sectionType as SectionType,
      orderIndex: section.orderIndex,
      backgroundType: section.backgroundType as BackgroundType,
      configuration: section.configuration,
      isActive: section.isActive,
      waitTimeHours: section.waitTimeHours,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
    };
  }

  /**
   * Returns all sections, optionally filtered by publication status
   * @param moduleId Optional module ID to filter by
   * @param includeUnpublished Whether to include unpublished sections
   * @returns Promise with array of game section DTOs
   */
  async getAllSections(moduleId?: string, includeUnpublished = false): Promise<GameSectionDto[]> {
    const query = this.gameSectionRepository.createQueryBuilder('section')
      .leftJoinAndSelect('section.module', 'module')
      .orderBy('module.orderIndex', 'ASC')
      .addOrderBy('section.orderIndex', 'ASC');
    
    if (moduleId) {
      query.where('section.moduleId = :moduleId', { moduleId });
    }
    
    if (!includeUnpublished) {
      query.andWhere('section.isActive = :isActive', { isActive: true });
    }
    
    const sections = await query.getMany();
    return sections.map(section => this.mapToDto(section));
  }

  /**
   * Delete a section
   * @param id Section ID
   * @returns Promise void
   */
  async delete(id: string): Promise<void> {
    return this.remove(id);
  }

  /**
   * Get a section by ID
   * @param id Section ID
   * @returns Promise with section DTO
   */
  async getSectionById(id: string): Promise<GameSectionDto> {
    return this.findOne(id);
  }

  /**
   * Get sections by module ID
   * @param moduleId Module ID
   * @returns Promise with array of game section DTOs
   */
  async getSectionsByModuleId(moduleId: string): Promise<GameSectionDto[]> {
    const { sections } = await this.findAllByModule(moduleId);
    return sections;
  }

  /**
   * Count total number of sections
   * @returns Promise with count
   */
  async countSections(): Promise<number> {
    return this.gameSectionRepository.count();
  }

  /**
   * Count total number of modules
   * @returns Promise with count
   */
  async countModules(): Promise<number> {
    return this.gameModuleRepository.count();
  }

  /**
   * Get statistics for each module
   * @returns Promise with module statistics
   */
  async getModuleStatistics(): Promise<any> {
    const modules = await this.gameModuleRepository.find();
    
    const stats = await Promise.all(modules.map(async (module) => {
      const totalSections = await this.gameSectionRepository.count({
        where: { moduleId: module.id }
      });
      
      const activeSections = await this.gameSectionRepository.count({
        where: { moduleId: module.id, isActive: true }
      });
      
      return {
        moduleId: module.id,
        moduleTitle: module.title,
        totalSections,
        activeSections,
        completionPercentage: totalSections > 0 
          ? Math.round((activeSections / totalSections) * 100) 
          : 0
      };
    }));
    
    return stats;
  }
}