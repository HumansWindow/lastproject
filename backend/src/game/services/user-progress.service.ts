import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserProgress } from '../entities/user-progress.entity';
import { GameModule } from '../entities/game-module.entity';
import { GameSection } from '../entities/game-section.entity';
import { SectionCheckpoint } from '../entities/section-checkpoint.entity';
import { ProgressStatus } from '../interfaces/progress-status.interface';
import {
  UserProgressDto,
  UserModuleProgressDto,
  UserSectionProgressDto,
  UpdateUserProgressDto,
  CheckpointCompletionDto,
  UserProgressSummaryDto
} from '../dto/progress.dto';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>,
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>,
    @InjectRepository(SectionCheckpoint)
    private readonly checkpointRepository: Repository<SectionCheckpoint>
  ) {}

  /**
   * Get progress for all modules for a user
   * @param userId User ID
   * @returns Promise with user progress summary
   */
  async getUserProgressSummary(userId: string): Promise<UserProgressSummaryDto> {
    // Get all active modules
    const modules = await this.gameModuleRepository.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
      relations: ['sections']
    });
    
    // Get user progress records
    const progressRecords = await this.userProgressRepository.find({
      where: { userId: userId },
      relations: ['section'] // Updated from 'checkpoints' to 'section'
    });
    
    // Transform into module progress objects
    const moduleProgress = await Promise.all(modules.map(async (module) => {
      // Find progress record for this module
      const progressRecord = progressRecords.find(
        p => p.moduleId === module.id && p.sectionId === null
      );
      
      // Calculate section progress
      const sections = await Promise.all(module.sections
        .filter(s => s.isActive)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(async (section) => {
          const sectionProgress = progressRecords.find(
            p => p.moduleId === module.id && p.sectionId === section.id
          );
          
          return {
            id: section.id,
            title: section.title,
            status: sectionProgress?.status || ProgressStatus.NOT_STARTED,
            completedAt: sectionProgress?.completedAt
          };
        }));
      
      // Calculate completion percentage
      const totalSections = sections.length;
      const completedSections = sections.filter(s => s.status === ProgressStatus.COMPLETED).length;
      const completionPercentage = totalSections > 0 
        ? Math.floor((completedSections / totalSections) * 100) 
        : 0;
      
      return {
        moduleId: module.id,
        moduleTitle: module.title,
        progress: completionPercentage,
        isCompleted: progressRecord?.status === ProgressStatus.COMPLETED,
        completionDate: progressRecord?.completedAt,
        // Extra properties for internal use
        _status: progressRecord?.status || ProgressStatus.NOT_STARTED,
        _sectionsCount: totalSections,
        _completedSectionsCount: completedSections,
        _startedAt: progressRecord?.startedAt
      };
    }));
    
    const completedModules = moduleProgress.filter(m => m._status === ProgressStatus.COMPLETED).length;
    
    return {
      userId,
      moduleId: '', // Required field per DTO definition
      moduleTitle: 'All Modules', // Required field per DTO definition
      status: completedModules === modules.length ? 
        ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
      startedAt: new Date(), // Required field per DTO definition
      completionPercentage: modules.length > 0 
        ? Math.floor((completedModules / modules.length) * 100) 
        : 0,
      sections: [], // Required field per DTO definition
      isNextModuleUnlocked: false, // Required field per DTO definition
      modules: moduleProgress // Required field per DTO definition
    };
  }

  /**
   * Get detailed progress for a specific module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with module progress details
   */
  async getModuleProgress(
    userId: string, 
    moduleId: string
  ): Promise<UserModuleProgressDto> {
    // Verify module exists
    const module = await this.gameModuleRepository.findOne({ 
      where: { id: moduleId },
      relations: ['sections']
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Get module level progress
    const moduleProgress = await this.userProgressRepository.findOne({ 
      where: { 
        userId: userId, 
        moduleId: moduleId,
        sectionId: null
      }
    });
    
    // Get progress for all sections in the module
    const sectionProgressRecords = await this.userProgressRepository.find({
      where: { 
        userId: userId, 
        moduleId: moduleId,
        sectionId: In(module.sections.map(s => s.id)) // Fixed: proper TypeORM syntax
      },
      relations: ['section'] // Changed from checkpoints to section
    });
    
    // Transform into section progress objects
    const sections = await Promise.all(module.sections
      .filter(s => s.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(async (section) => {
        const sectionProgress = sectionProgressRecords.find(
          p => p.sectionId === section.id
        );
        
        // Get checkpoints for this section (handled differently since relations changed)
        const checkpoints = await this.checkpointRepository.find({
          where: {
            progressId: sectionProgress?.id
          }
        });
        
        const checkpointData = checkpoints.map(cp => ({
          id: cp.id,
          checkpointType: cp.checkpointType,
          completedAt: cp.completedAt
        }));
        
        return {
          id: section.id,
          title: section.title,
          orderIndex: section.orderIndex,
          sectionType: section.sectionType,
          status: sectionProgress?.status || ProgressStatus.NOT_STARTED,
          startedAt: sectionProgress?.startedAt,
          completedAt: sectionProgress?.completedAt,
          lastUpdatedAt: sectionProgress?.updatedAt,
          checkpoints: checkpointData
        };
      }));
    
    // Calculate completion percentage
    const totalSections = sections.length;
    const completedSections = sections.filter(s => s.status === ProgressStatus.COMPLETED).length;
    const completionPercentage = totalSections > 0 
      ? Math.floor((completedSections / totalSections) * 100) 
      : 0;
    
    // Create a DTO that matches the expected structure
    return {
      moduleId,
      moduleTitle: module.title,
      progress: completionPercentage,
      sectionsCompleted: completedSections,
      totalSections: totalSections,
      isCompleted: completedSections === totalSections && totalSections > 0,
      completionDate: moduleProgress?.completedAt,
      rewardClaimed: moduleProgress?.rewardClaimed || false,
      rewardClaimDate: moduleProgress?.rewardClaimDate,
      lastSectionId: sections.length > 0 ? sections[sections.length - 1].id : undefined,
      lastSectionTitle: sections.length > 0 ? sections[sections.length - 1].title : undefined
    };
  }

  /**
   * Get detailed progress for a specific section
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with section progress details
   */
  async getSectionProgress(
    userId: string, 
    sectionId: string
  ): Promise<UserSectionProgressDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({ 
      where: { id: sectionId },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get section level progress
    const sectionProgress = await this.userProgressRepository.findOne({ 
      where: { 
        userId: userId, 
        moduleId: section.moduleId,
        sectionId: sectionId
      }
    });
    
    // Get checkpoints separately since the relation was causing issues
    const checkpoints = await this.checkpointRepository.find({
      where: {
        progressId: sectionProgress?.id
      }
    });
    
    // Get module level progress
    const moduleProgress = await this.userProgressRepository.findOne({ 
      where: { 
        userId: userId, 
        moduleId: section.moduleId,
        sectionId: null
      }
    });
    
    return {
      id: sectionProgress?.id || '',
      userId: userId,
      moduleId: section.moduleId,
      sectionId: sectionId,
      status: sectionProgress?.status || ProgressStatus.NOT_STARTED,
      startedAt: sectionProgress?.startedAt || new Date(),
      completedAt: sectionProgress?.completedAt,
      updatedAt: sectionProgress?.updatedAt || new Date()
    };
  }

  /**
   * Start a module for a user
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with updated progress DTO
   */
  async startModule(userId: string, moduleId: string): Promise<UserProgressDto> {
    // Verify module exists
    const module = await this.gameModuleRepository.findOne({ 
      where: { id: moduleId } 
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Check if this module has a prerequisite
    if (module.prerequisiteModuleId) {
      const prerequisiteCompleted = await this.isModuleCompleted(
        userId, 
        module.prerequisiteModuleId
      );
      
      if (!prerequisiteCompleted) {
        throw new ForbiddenException(
          `Cannot start module ${moduleId}: prerequisite module ${module.prerequisiteModuleId} is not completed`
        );
      }
    }
    
    // Get or create progress record
    let progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: null
      }
    });
    
    if (!progress) {
      progress = this.userProgressRepository.create({
        userId: userId,
        moduleId: moduleId,
        sectionId: null,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date()
      });
    } else if (progress.status === ProgressStatus.NOT_STARTED) {
      progress.status = ProgressStatus.IN_PROGRESS;
      progress.startedAt = new Date();
    }
    
    progress.updatedAt = new Date();
    const savedProgress = await this.userProgressRepository.save(progress);
    
    return {
      id: savedProgress.id,
      userId: savedProgress.userId,
      moduleId: savedProgress.moduleId,
      sectionsCompleted: 0, // Add required field
      isCompleted: false, // Add required field
      rewardClaimed: false, // Add required field
      createdAt: savedProgress.createdAt || savedProgress.startedAt, // Add required field
      updatedAt: savedProgress.updatedAt
    };
  }

  /**
   * Start a section for a user
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with updated progress DTO
   */
  async startSection(userId: string, sectionId: string): Promise<UserProgressDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({ 
      where: { id: sectionId } 
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    const moduleId = section.moduleId;
    
    // Ensure module is started
    await this.startModule(userId, moduleId);
    
    // Check if this is the first section in the module
    const isFirstSection = await this.isFirstSectionInModule(sectionId, moduleId);
    
    if (!isFirstSection) {
      // Check if previous section is completed
      const prevSectionCompleted = await this.isPreviousSectionCompleted(
        userId, 
        sectionId, 
        moduleId
      );
      
      if (!prevSectionCompleted) {
        throw new ForbiddenException(
          `Cannot start section ${sectionId}: previous section is not completed`
        );
      }
    }
    
    // Get or create progress record
    let progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: sectionId
      }
    });
    
    if (!progress) {
      progress = this.userProgressRepository.create({
        userId: userId,
        moduleId: moduleId,
        sectionId: sectionId,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date()
      });
    } else if (progress.status === ProgressStatus.NOT_STARTED) {
      progress.status = ProgressStatus.IN_PROGRESS;
      progress.startedAt = new Date();
    }
    
    progress.updatedAt = new Date();
    const savedProgress = await this.userProgressRepository.save(progress);
    
    return {
      id: savedProgress.id,
      userId: savedProgress.userId,
      moduleId: savedProgress.moduleId,
      sectionsCompleted: 0, // Required field
      isCompleted: false, // Required field
      rewardClaimed: false, // Required field
      createdAt: savedProgress.createdAt || savedProgress.startedAt, // Required field
      updatedAt: savedProgress.updatedAt
    };
  }

  /**
   * Update progress for a module or section
   * @param userId User ID
   * @param updateDto DTO with progress update data
   * @returns Promise with updated progress DTO
   */
  async updateProgress(
    userId: string, 
    updateDto: UpdateUserProgressDto
  ): Promise<UserProgressDto> {
    // Since moduleId and sectionId are not in UpdateUserProgressDto, we need to extract them from parameters
    const { moduleId, sectionId, status, ...otherUpdates } = updateDto as any;
    
    if (!moduleId) {
      throw new BadRequestException('Module ID is required');
    }
    
    // Find progress record
    let progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: sectionId || null
      }
    });
    
    if (!progress) {
      // Auto-start if not already started
      if (sectionId) {
        return this.startSection(userId, sectionId);
      } else {
        return this.startModule(userId, moduleId);
      }
    }
    
    // Update status if provided
    if (status) {
      // Convert string status to ProgressStatus enum
      progress.status = status === 'completed' ? ProgressStatus.COMPLETED : 
                       status === 'in_progress' ? ProgressStatus.IN_PROGRESS : 
                       ProgressStatus.NOT_STARTED;
      
      // Set completion timestamp if status is 'completed'
      if (status === 'completed' && !progress.completedAt) {
        progress.completedAt = new Date();
        
        // If this is a section being completed, check if all module sections are completed
        if (sectionId) {
          await this.checkModuleCompletion(userId, moduleId);
        }
      }
    }
    
    // Apply other updates
    Object.assign(progress, otherUpdates);
    
    progress.updatedAt = new Date();
    const savedProgress = await this.userProgressRepository.save(progress);
    
    return {
      id: savedProgress.id,
      userId: savedProgress.userId,
      moduleId: savedProgress.moduleId,
      sectionsCompleted: 0, // Required field
      isCompleted: savedProgress.status === ProgressStatus.COMPLETED,
      rewardClaimed: savedProgress.rewardClaimed || false,
      createdAt: savedProgress.createdAt || savedProgress.startedAt,
      updatedAt: savedProgress.updatedAt
    };
  }

  /**
   * Mark a checkpoint as completed
   * @param userId User ID
   * @param checkpointDto DTO with checkpoint data
   * @returns Promise with success status
   */
  async completeCheckpoint(
    userId: string, 
    checkpointDto: CheckpointCompletionDto
  ): Promise<{ success: boolean }> {
    const { sectionId, isCompleted, responses, timeSpent } = checkpointDto;
    
    // Verify section exists and get its module ID
    const section = await this.gameSectionRepository.findOne({ 
      where: { id: sectionId } 
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    const moduleId = section.moduleId;
    
    // Ensure section is started
    await this.startSection(userId, sectionId);
    
    // Get progress record for this section
    const progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: sectionId
      }
    });
    
    if (!progress) {
      throw new BadRequestException(`No progress record found for section ${sectionId}`);
    }
    
    // Using a default checkpoint type since it's not in the DTO
    const checkpointType = 'content';
    
    // Check if checkpoint already exists
    let checkpoint = await this.checkpointRepository.findOne({
      where: {
        progressId: progress.id,
        checkpointType: checkpointType
      }
    });
    
    if (!checkpoint) {
      // Create new checkpoint
      checkpoint = this.checkpointRepository.create({
        progressId: progress.id,
        checkpointType: checkpointType,
        completedAt: isCompleted ? new Date() : null,
        responses: responses,
        timeSpent: timeSpent
      });
    } else {
      // Update existing checkpoint
      checkpoint.completedAt = isCompleted ? new Date() : checkpoint.completedAt;
      if (responses) checkpoint.responses = responses;
      if (timeSpent) checkpoint.timeSpent = timeSpent;
    }
    
    await this.checkpointRepository.save(checkpoint);
    
    // Update progress record's updatedAt timestamp
    progress.updatedAt = new Date();
    await this.userProgressRepository.save(progress);
    
    return { success: true };
  }

  /**
   * Check if all sections in a module are completed and update module progress if needed
   * @param userId User ID
   * @param moduleId Module ID
   * @private
   */
  private async checkModuleCompletion(
    userId: string, 
    moduleId: string
  ): Promise<void> {
    // Get all active sections in the module
    const sections = await this.gameSectionRepository.find({
      where: {
        moduleId: moduleId,
        isActive: true
      }
    });
    
    const sectionIds = sections.map(s => s.id);
    
    // Get progress records for all sections
    const sectionProgress = await this.userProgressRepository.find({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: In(sectionIds) // Fixed: proper TypeORM syntax with In operator
      }
    });
    
    // Check if all sections are completed
    const allCompleted = sections.every(section => 
      sectionProgress.some(p => 
        p.sectionId === section.id && p.status === ProgressStatus.COMPLETED
      )
    );
    
    if (allCompleted) {
      // Update module progress
      let moduleProgress = await this.userProgressRepository.findOne({
        where: {
          userId: userId,
          moduleId: moduleId,
          sectionId: null
        }
      });
      
      if (!moduleProgress) {
        moduleProgress = this.userProgressRepository.create({
          userId: userId,
          moduleId: moduleId,
          sectionId: null,
          status: ProgressStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date()
        });
      } else {
        moduleProgress.status = ProgressStatus.COMPLETED;
        moduleProgress.completedAt = new Date();
      }
      
      moduleProgress.updatedAt = new Date();
      await this.userProgressRepository.save(moduleProgress);
    }
  }

  /**
   * Check if a module is completed by a user
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with boolean indicating if module is completed
   * @private
   */
  private async isModuleCompleted(
    userId: string, 
    moduleId: string
  ): Promise<boolean> {
    const progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: null
      }
    });
    
    return progress?.status === ProgressStatus.COMPLETED;
  }

  /**
   * Check if a section is the first one in its module
   * @param sectionId Section ID
   * @param moduleId Module ID
   * @returns Promise with boolean indicating if section is first in module
   * @private
   */
  private async isFirstSectionInModule(
    sectionId: string, 
    moduleId: string
  ): Promise<boolean> {
    const firstSection = await this.gameSectionRepository.findOne({
      where: { moduleId: moduleId },
      order: { orderIndex: 'ASC' }
    });
    
    return firstSection?.id === sectionId;
  }

  /**
   * Check if the previous section in a module is completed
   * @param userId User ID
   * @param sectionId Current section ID
   * @param moduleId Module ID
   * @returns Promise with boolean indicating if previous section is completed
   * @private
   */
  private async isPreviousSectionCompleted(
    userId: string, 
    sectionId: string, 
    moduleId: string
  ): Promise<boolean> {
    // Get current section
    const currentSection = await this.gameSectionRepository.findOne({
      where: { id: sectionId }
    });
    
    if (!currentSection) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get previous section
    const previousSection = await this.gameSectionRepository.findOne({
      where: {
        moduleId: moduleId,
        orderIndex: currentSection.orderIndex - 1,
        isActive: true
      }
    });
    
    if (!previousSection) {
      // This is the first section, or the previous one is inactive
      return true;
    }
    
    // Check if previous section is completed
    const prevProgress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: previousSection.id
      }
    });
    
    return prevProgress?.status === ProgressStatus.COMPLETED;
  }

  /**
   * Check if the next module should be unlocked based on completion of this module
   * @param userId User ID
   * @param moduleId Current module ID
   * @returns Promise with boolean indicating if next module is unlocked
   * @private
   */
  private async isNextModuleUnlocked(
    userId: string, 
    moduleId: string
  ): Promise<boolean> {
    // Get current module
    const currentModule = await this.gameModuleRepository.findOne({
      where: { id: moduleId }
    });
    
    if (!currentModule) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Check if current module is completed
    const isCompleted = await this.isModuleCompleted(userId, moduleId);
    if (!isCompleted) {
      return false;
    }
    
    // Find modules that have this module as prerequisite
    const dependentModules = await this.gameModuleRepository.find({ 
      where: { 
        prerequisiteModuleId: moduleId,
        isActive: true
      },
      order: { orderIndex: 'ASC' }
    });
    
    if (dependentModules.length > 0) {
      return true;
    }
    
    // If no direct prerequisite relationship, get the next by order index
    const nextModule = await this.gameModuleRepository.findOne({
      where: { 
        orderIndex: currentModule.orderIndex + 1,
        isActive: true
      }
    });
    
    return nextModule !== null;
  }
}