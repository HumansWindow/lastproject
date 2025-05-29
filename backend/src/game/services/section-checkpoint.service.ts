import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionCheckpoint } from '../entities/section-checkpoint.entity';
import { GameSection } from '../entities/game-section.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { SectionCheckpointRepository } from '../repositories/section-checkpoint.repository';
import { 
  CheckpointCompletionDto, 
  SectionCompletionResultDto,
  UserSectionProgressDto
} from '../dto/progress.dto';
import { ProgressStatus, ModuleProgressStatus, CompatibleProgressStatus } from '../interfaces/progress-status.interface';

@Injectable()
export class SectionCheckpointService {
  constructor(
    private readonly checkpointRepository: SectionCheckpointRepository,
    @InjectRepository(GameSection)
    private readonly sectionRepository: Repository<GameSection>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>
  ) {}

  /**
   * Record a checkpoint completion for a section
   * @param userId User ID
   * @param checkpointData Checkpoint completion data
   * @returns Result with success status and checkpoint details
   */
  async completeCheckpoint(
    userId: string,
    checkpointData: CheckpointCompletionDto
  ): Promise<{ success: boolean; checkpoint: SectionCheckpoint }> {
    const { sectionId, checkpointType, contentId, isCompleted, responses, timeSpent } = checkpointData;
    
    // Verify section exists
    const section = await this.sectionRepository.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get or create progress for this section
    let progress = await this.userProgressRepository.findOne({
      where: {
        userId,
        moduleId: section.moduleId,
        sectionId
      }
    });
    
    if (!progress) {
      // Create progress record automatically
      progress = this.userProgressRepository.create({
        userId,
        moduleId: section.moduleId,
        sectionId,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date()
      });
      
      progress = await this.userProgressRepository.save(progress);
    }
    
    // Set default checkpoint type if not provided
    const checkpointTypeValue = checkpointType || (contentId ? `content-${contentId}` : 'generic');
    
    // Check for existing checkpoint
    let checkpoint = await this.checkpointRepository.findByTypeAndSection(
      userId, 
      sectionId, 
      checkpointTypeValue
    );
    
    const now = new Date();
    
    if (!checkpoint) {
      // Create new checkpoint
      checkpoint = await this.checkpointRepository.create({
        userId,
        sectionId,
        progressId: progress.id,
        checkpointType: checkpointTypeValue,
        isCompleted,
        completedAt: isCompleted ? now : null,
        responses,
        timeSpent
      });
    } else {
      // Update existing checkpoint
      if (isCompleted && !checkpoint.isCompleted) {
        checkpoint.isCompleted = true;
        checkpoint.completedAt = now;
      }
      
      // Update responses if provided (merge with existing)
      if (responses) {
        checkpoint.responses = { ...checkpoint.responses, ...responses };
      }
      
      // Add to time spent if provided
      if (timeSpent) {
        checkpoint.timeSpent = (checkpoint.timeSpent || 0) + timeSpent;
      }
      
      checkpoint = await this.checkpointRepository.getRepository().save(checkpoint);
    }
    
    // Update progress record's updatedAt timestamp
    progress.updatedAt = now;
    await this.userProgressRepository.save(progress);
    
    return { 
      success: true,
      checkpoint
    };
  }

  /**
   * Complete a section by creating or updating the section_complete checkpoint
   * @param userId User ID
   * @param sectionId Section ID
   * @param data Additional completion data
   * @returns Section completion result with next section info
   */
  async completeSection(
    userId: string,
    sectionId: string,
    data: {
      responses?: Record<string, any>;
      timeSpent?: number;
    } = {}
  ): Promise<SectionCompletionResultDto> {
    // Verify section exists
    const section = await this.sectionRepository.findOne({ 
      where: { id: sectionId },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get progress for this section
    let progress = await this.userProgressRepository.findOne({
      where: {
        userId,
        moduleId: section.moduleId,
        sectionId
      }
    });
    
    if (!progress) {
      throw new BadRequestException(`No progress found for section ${sectionId}. Start the section first.`);
    }
    
    // Mark section as completed
    const now = new Date();
    progress.status = ProgressStatus.COMPLETED;
    progress.completedAt = now;
    progress.updatedAt = now;
    
    await this.userProgressRepository.save(progress);
    
    // Create section completion checkpoint
    const checkpoint = await this.checkpointRepository.markSectionAsCompleted(
      userId,
      sectionId,
      progress.id,
      data
    );
    
    // Get next section in module
    const nextSection = await this.sectionRepository.findOne({
      where: {
        moduleId: section.moduleId,
        orderIndex: section.orderIndex + 1,
        isActive: true
      }
    });
    
    // Check if this was the last section in the module
    let moduleCompletion = null;
    if (!nextSection) {
      // This was potentially the last section
      // Check if all sections in module are now completed
      await this.checkModuleCompletion(userId, section.moduleId);
    }
    
    // Return result with info about next section
    return {
      sectionId,
      completed: true,
      nextSection: {
        hasNextSection: !!nextSection,
        nextSectionId: nextSection?.id,
        nextSectionTitle: nextSection?.title,
        unlockDate: nextSection ? this.calculateUnlockDate(nextSection.waitTimeHours || 0) : undefined,
        waitTimeHours: nextSection?.waitTimeHours || 0
      },
      moduleCompletion: moduleCompletion
    };
  }

  /**
   * Get detailed checkpoint status for a section
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Comprehensive checkpoint status info
   */
  async getCheckpointStatus(
    userId: string,
    sectionId: string
  ): Promise<{
    sectionProgress: UserSectionProgressDto;
    checkpoints: {
      type: string;
      isCompleted: boolean;
      completedAt: Date | null;
      timeSpent: number | null;
    }[];
    completionStats: {
      isCompleted: boolean;
      totalCheckpoints: number;
      completedCheckpoints: number;
      completionPercentage: number;
    };
  }> {
    // Verify section exists
    const section = await this.sectionRepository.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Get progress for this section
    const progress = await this.userProgressRepository.findOne({
      where: {
        userId,
        moduleId: section.moduleId,
        sectionId
      }
    });
    
    if (!progress) {
      throw new NotFoundException(`No progress found for section ${sectionId}`);
    }
    
    // Get all checkpoints for this section
    const checkpoints = await this.checkpointRepository.findByUserAndSection(
      userId, 
      sectionId
    );
    
    // Calculate stats
    const completedCheckpoints = checkpoints.filter(cp => cp.isCompleted).length;
    const totalCheckpoints = checkpoints.length;
    const completionPercentage = totalCheckpoints > 0 
      ? Math.floor((completedCheckpoints / totalCheckpoints) * 100)
      : 0;
    
    const sectionCompleteCheckpoint = checkpoints.find(
      cp => cp.checkpointType === 'section_complete'
    );
    
    return {
      sectionProgress: {
        id: progress.id,
        userId,
        moduleId: section.moduleId,
        sectionId,
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        updatedAt: progress.updatedAt
      },
      checkpoints: checkpoints.map(cp => ({
        type: cp.checkpointType || 'unknown',
        isCompleted: cp.isCompleted,
        completedAt: cp.completedAt,
        timeSpent: cp.timeSpent
      })),
      completionStats: {
        isCompleted: sectionCompleteCheckpoint?.isCompleted || false,
        totalCheckpoints,
        completedCheckpoints,
        completionPercentage
      }
    };
  }

  /**
   * Check if a user can proceed to the next section
   * @param userId User ID
   * @param sectionId Current section ID
   * @returns Boolean indicating if user can proceed and reason if not
   */
  async canProceedToNextSection(
    userId: string,
    sectionId: string
  ): Promise<{
    canProceed: boolean;
    reason?: string;
    currentSectionCompleted: boolean;
    nextSectionId?: string;
  }> {
    // Verify section exists
    const section = await this.sectionRepository.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Check if current section is completed
    const isCompleted = await this.checkpointRepository.isCompleted(userId, sectionId);
    
    // Get next section
    const nextSection = await this.sectionRepository.findOne({
      where: {
        moduleId: section.moduleId,
        orderIndex: section.orderIndex + 1,
        isActive: true
      }
    });
    
    if (!nextSection) {
      // This was the last section
      return {
        canProceed: false,
        reason: 'LAST_SECTION_IN_MODULE',
        currentSectionCompleted: isCompleted
      };
    }
    
    if (!isCompleted) {
      // Current section not completed, can't proceed
      return {
        canProceed: false,
        reason: 'CURRENT_SECTION_NOT_COMPLETED',
        currentSectionCompleted: false,
        nextSectionId: nextSection.id
      };
    }
    
    // Check if there's a waiting period
    if (section.waitTimeHours && section.waitTimeHours > 0) {
      const progress = await this.userProgressRepository.findOne({
        where: {
          userId,
          sectionId
        }
      });
      
      if (progress?.completedAt) {
        const unlockDate = this.calculateUnlockDate(
          section.waitTimeHours,
          progress.completedAt
        );
        
        const now = new Date();
        if (now < unlockDate) {
          // Still in waiting period
          return {
            canProceed: false,
            reason: 'WAITING_PERIOD',
            currentSectionCompleted: true,
            nextSectionId: nextSection.id
          };
        }
      }
    }
    
    // All checks passed, can proceed
    return {
      canProceed: true,
      currentSectionCompleted: true,
      nextSectionId: nextSection.id
    };
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
  ): Promise<boolean> {
    // Get all active sections in the module
    const sections = await this.sectionRepository.find({
      where: {
        moduleId: moduleId,
        isActive: true
      }
    });
    
    // Check if all sections are completed
    const allCompleted = await Promise.all(
      sections.map(section => 
        this.checkpointRepository.isCompleted(userId, section.id)
      )
    ).then(results => results.every(isCompleted => isCompleted));
    
    if (allCompleted) {
      // Update module progress
      let moduleProgress = await this.userProgressRepository.findOne({
        where: {
          userId: userId,
          moduleId: moduleId,
          sectionId: null
        }
      });
      
      const now = new Date();
      
      if (!moduleProgress) {
        moduleProgress = this.userProgressRepository.create({
          userId: userId,
          moduleId: moduleId,
          sectionId: null,
          status: ProgressStatus.COMPLETED,
          startedAt: now,
          completedAt: now
        });
      } else {
        moduleProgress.status = ProgressStatus.COMPLETED;
        moduleProgress.completedAt = now;
      }
      
      moduleProgress.updatedAt = now;
      await this.userProgressRepository.save(moduleProgress);
    }
    
    return allCompleted;
  }

  /**
   * Check if a section is completed by a user
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Boolean indicating if section is completed
   */
  async isSectionCompleted(userId: string, sectionId: string): Promise<boolean> {
    return this.checkpointRepository.isCompleted(userId, sectionId);
  }

  /**
   * Get completion status for all section checkpoints
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Object with completion status and details
   */
  async getSectionCompletionStatus(userId: string, sectionId: string) {
    return this.checkpointRepository.getSectionCompletionStatus(userId, sectionId);
  }

  /**
   * Calculate when the next section should unlock
   * @param waitTimeHours Hours to wait
   * @param startTime Starting time (defaults to now)
   * @returns Date when section should unlock
   */
  private calculateUnlockDate(waitTimeHours: number, startTime: Date = new Date()): Date {
    const unlockDate = new Date(startTime);
    unlockDate.setHours(unlockDate.getHours() + waitTimeHours);
    return unlockDate;
  }
}