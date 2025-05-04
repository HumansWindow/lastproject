import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameModule } from '../entities/game-module.entity';
import { GameSection } from '../entities/game-section.entity';
import { 
  GameModuleDto, 
  GameModuleListDto, 
  CreateGameModuleDto, 
  UpdateGameModuleDto,
  GameModuleWithSectionsDto,
  GameModuleSummaryDto
} from '../dto/module.dto';
import { BackgroundType, SectionType } from '../dto/section.dto';

@Injectable()
export class GameModulesService {
  constructor(
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>,
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>
  ) {}

  /**
   * Find all game modules
   * @param active Optional filter for active modules only
   * @returns Promise with game module list DTO
   */
  async findAll(active?: boolean): Promise<GameModuleListDto> {
    const query = this.gameModuleRepository.createQueryBuilder('module')
      .orderBy('module.orderIndex', 'ASC');
    
    if (active !== undefined) {
      query.where('module.isActive = :active', { active });
    }
    
    const modules = await query.getMany();
    const totalCount = await query.getCount();
    
    return {
      modules: modules.map(module => this.mapToDto(module)),
      totalCount
    };
  }

  /**
   * Find a game module by ID
   * @param id Module ID
   * @returns Promise with game module DTO
   */
  async findOne(id: string): Promise<GameModuleDto> {
    const module = await this.gameModuleRepository.findOne({ where: { id } });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${id} not found`);
    }
    
    return this.mapToDto(module);
  }

  /**
   * Find a game module with all its sections
   * @param id Module ID
   * @returns Promise with game module with sections DTO
   */
  async findWithSections(id: string): Promise<GameModuleWithSectionsDto> {
    const module = await this.gameModuleRepository.findOne({ 
      where: { id },
      relations: ['sections']
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${id} not found`);
    }
    
    // Sort sections by orderIndex
    const sortedSections = module.sections
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .filter(section => section.isActive);
    
    const completedSections = 0; // This would typically come from user progress
    
    return {
      ...this.mapToDto(module),
      sections: sortedSections.map(section => ({
        id: section.id,
        title: section.title,
        sectionType: section.sectionType as SectionType,
        orderIndex: section.orderIndex,
        isActive: section.isActive,
        moduleId: module.id,
        backgroundType: section.backgroundType as BackgroundType || 'default' as BackgroundType,
        configuration: section.configuration || {},
        createdAt: section.createdAt,
        updatedAt: section.updatedAt
      })),
      totalSections: sortedSections.length,
      completedSections,
      progressPercentage: sortedSections.length > 0 ? 
        Math.floor((completedSections / sortedSections.length) * 100) : 0
    };
  }

  /**
   * Create a new game module
   * @param createDto DTO with module data
   * @returns Promise with created game module DTO
   */
  async create(createDto: CreateGameModuleDto): Promise<GameModuleDto> {
    // Validate prerequisite module if provided
    if (createDto.prerequisiteModuleId) {
      const prerequisiteExists = await this.gameModuleRepository.findOne({ 
        where: { id: createDto.prerequisiteModuleId } 
      });
      
      if (!prerequisiteExists) {
        throw new BadRequestException(`Prerequisite module with ID ${createDto.prerequisiteModuleId} not found`);
      }
    }
    
    // Get highest order index and add 1 for new module
    let orderIndex = createDto.orderIndex;
    if (orderIndex === undefined) {
      const lastModule = await this.gameModuleRepository.findOne({
        order: { orderIndex: 'DESC' }
      });
      
      orderIndex = lastModule ? lastModule.orderIndex + 1 : 0;
    }
    
    const module = this.gameModuleRepository.create({
      title: createDto.title,
      description: createDto.description,
      orderIndex: orderIndex,
      isActive: createDto.isActive ?? true,
      prerequisiteModuleId: createDto.prerequisiteModuleId,
      timeToComplete: createDto.timeToComplete,
      waitTimeHours: createDto.waitTimeHours ?? 0,
      rewardAmount: createDto.rewardAmount ? Number(createDto.rewardAmount) : 0
    });
    
    const savedModule = await this.gameModuleRepository.save(module);
    return this.mapToDto(savedModule);
  }

  /**
   * Update an existing game module
   * @param id Module ID
   * @param updateDto DTO with module data to update
   * @returns Promise with updated game module DTO
   */
  async update(id: string, updateDto: UpdateGameModuleDto): Promise<GameModuleDto> {
    const module = await this.gameModuleRepository.findOne({ where: { id } });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${id} not found`);
    }
    
    // Validate prerequisite module if provided
    if (updateDto.prerequisiteModuleId !== undefined) {
      if (updateDto.prerequisiteModuleId === id) {
        throw new BadRequestException('Module cannot be a prerequisite for itself');
      }
      
      if (updateDto.prerequisiteModuleId) {
        const prerequisiteExists = await this.gameModuleRepository.findOne({ 
          where: { id: updateDto.prerequisiteModuleId } 
        });
        
        if (!prerequisiteExists) {
          throw new BadRequestException(`Prerequisite module with ID ${updateDto.prerequisiteModuleId} not found`);
        }
      }
    }
    
    // Update module properties
    if (updateDto.title !== undefined) module.title = updateDto.title;
    if (updateDto.description !== undefined) module.description = updateDto.description;
    if (updateDto.orderIndex !== undefined) module.orderIndex = updateDto.orderIndex;
    if (updateDto.isActive !== undefined) module.isActive = updateDto.isActive;
    if (updateDto.prerequisiteModuleId !== undefined) module.prerequisiteModuleId = updateDto.prerequisiteModuleId;
    if (updateDto.timeToComplete !== undefined) module.timeToComplete = updateDto.timeToComplete;
    if (updateDto.waitTimeHours !== undefined) module.waitTimeHours = updateDto.waitTimeHours;
    if (updateDto.rewardAmount !== undefined) module.rewardAmount = updateDto.rewardAmount;
    
    module.updatedAt = new Date();
    const savedModule = await this.gameModuleRepository.save(module);
    return this.mapToDto(savedModule);
  }

  /**
   * Delete a game module
   * @param id Module ID
   */
  async remove(id: string): Promise<void> {
    const module = await this.gameModuleRepository.findOne({ 
      where: { id },
      relations: ['sections']
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${id} not found`);
    }
    
    // Check if there are any modules that depend on this one as a prerequisite
    const dependentModules = await this.gameModuleRepository.find({ 
      where: { prerequisiteModuleId: id } 
    });
    
    if (dependentModules.length > 0) {
      throw new BadRequestException(
        `Cannot delete module: ${dependentModules.length} other module(s) depend on it as a prerequisite`
      );
    }
    
    if (module.sections.length > 0) {
      throw new BadRequestException(
        `Cannot delete module: It contains ${module.sections.length} sections. Delete the sections first.`
      );
    }
    
    await this.gameModuleRepository.remove(module);
  }

  /**
   * Get module summaries for the game dashboard
   * @returns Promise with game module summaries
   */
  async getModuleSummaries(): Promise<GameModuleSummaryDto[]> {
    const modules = await this.gameModuleRepository.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
      relations: ['sections']
    });
    
    return modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      sectionsCount: module.sections.length,
      timeToComplete: module.timeToComplete,
      waitTimeHours: module.waitTimeHours,
      rewardAmount: module.rewardAmount,
      prerequisiteModuleId: module.prerequisiteModuleId,
      isActive: module.isActive
    }));
  }

  /**
   * Check if a module exists
   * @param id Module ID
   * @returns Promise with boolean indicating if module exists
   */
  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const count = await this.gameModuleRepository.count({ where: { id } });
    return count > 0;
  }
  
  /**
   * Find the next module in sequence after the given module
   * @param currentModuleId Current module ID
   * @returns Promise with next module or null if none
   */
  async findNextInSequence(currentModuleId: string): Promise<GameModule | null> {
    const currentModule = await this.gameModuleRepository.findOne({ 
      where: { id: currentModuleId } 
    });
    
    if (!currentModule) {
      throw new NotFoundException(`Game module with ID ${currentModuleId} not found`);
    }
    
    // Find modules that have this module as prerequisite
    const nextModules = await this.gameModuleRepository.find({ 
      where: { prerequisiteModuleId: currentModuleId },
      order: { orderIndex: 'ASC' }
    });
    
    if (nextModules.length > 0) {
      return nextModules[0]; // Return the first one by order index
    }
    
    // If no direct prerequisite relationship, get the next by order index
    const nextByOrder = await this.gameModuleRepository.findOne({
      where: { 
        orderIndex: currentModule.orderIndex + 1,
        isActive: true
      }
    });
    
    return nextByOrder || null;
  }

  /**
   * Map entity to DTO
   * @param module Game module entity
   * @returns Game module DTO
   */
  private mapToDto(module: GameModule): GameModuleDto {
    return {
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      isActive: module.isActive,
      prerequisiteModuleId: module.prerequisiteModuleId,
      timeToComplete: module.timeToComplete,
      waitTimeHours: module.waitTimeHours,
      rewardAmount: module.rewardAmount,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };
  }
}