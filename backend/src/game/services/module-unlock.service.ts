import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleUnlockSchedule } from '../entities/module-unlock-schedule.entity';
import { SectionUnlockSchedule } from '../entities/section-unlock-schedule.entity';
import { GameModule } from '../entities/game-module.entity';
import { GameSection } from '../entities/game-section.entity';
import { UserProgress } from '../entities/user-progress.entity';
import {
  ModuleUnlockInfoDto,
  ModuleUnlockListDto,
  SectionUnlockInfoDto,
  SectionUnlockListDto,
  ModuleAccessResultDto,
  SectionAccessResultDto,
  TimeRemainingDto,
  ExpediteResultDto,
  ModuleUnlockUpdateResultDto
} from '../dto/unlock.dto';
import { ConfigService } from '@nestjs/config';
import { UnlockStatus } from '../interfaces/unlock-status.interface';
import { GameNotificationService } from './game-notification.service';

@Injectable()
export class ModuleUnlockService {
  private readonly logger = new Logger(ModuleUnlockService.name);

  constructor(
    @InjectRepository(ModuleUnlockSchedule)
    private readonly moduleUnlockRepository: Repository<ModuleUnlockSchedule>,
    @InjectRepository(SectionUnlockSchedule)
    private readonly sectionUnlockRepository: Repository<SectionUnlockSchedule>,
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>,
    @InjectRepository(GameSection)
    private readonly gameSectionRepository: Repository<GameSection>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    private readonly configService: ConfigService,
    private readonly notificationService: GameNotificationService
  ) {}

  /**
   * Schedule the next module unlock when a module is completed
   * @param userId User ID
   * @param completedModuleId ID of the completed module
   * @returns Promise with module unlock information
   */
  async scheduleModuleUnlock(
    userId: string,
    completedModuleId: string
  ): Promise<ModuleUnlockInfoDto> {
    // Get completed module
    const completedModule = await this.gameModuleRepository.findOne({
      where: { id: completedModuleId }
    });
    
    if (!completedModule) {
      throw new NotFoundException(`Game module with ID ${completedModuleId} not found`);
    }
    
    // Find next module in sequence (either by prerequisite or order index)
    const nextModule = await this.findNextModule(completedModuleId);
    
    if (!nextModule) {
      return { hasNextModule: false };
    }
    
    // Calculate unlock date based on waiting period
    const waitTimeHours = nextModule.waitTimeHours || 0;
    const unlockDate = new Date();
    unlockDate.setHours(unlockDate.getHours() + waitTimeHours);
    
    // Create or update unlock schedule entry
    const existingSchedule = await this.moduleUnlockRepository.findOne({
      where: {
        userId: userId,
        moduleId: nextModule.id
      }
    });
    
    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.previousModuleId = completedModuleId;
      existingSchedule.unlockDate = unlockDate;
      existingSchedule.isUnlocked = waitTimeHours === 0;
      existingSchedule.updatedAt = new Date();
      await this.moduleUnlockRepository.save(existingSchedule);
    } else {
      // Create new schedule
      const unlockSchedule = this.moduleUnlockRepository.create({
        userId: userId,
        moduleId: nextModule.id,
        previousModuleId: completedModuleId,
        unlockDate: unlockDate,
        isUnlocked: waitTimeHours === 0
      });
      await this.moduleUnlockRepository.save(unlockSchedule);
    }
    
    // Schedule notifications for this unlock
    if (waitTimeHours > 0) {
      await this.notificationService.scheduleUnlockNotifications(
        userId,
        nextModule.id,
        unlockDate,
        waitTimeHours
      );
    }
    
    return {
      hasNextModule: true,
      nextModuleId: nextModule.id,
      nextModuleTitle: nextModule.title,
      unlockDate,
      waitTimeHours
    };
  }

  /**
   * Schedule a section unlock when a section is completed
   * @param userId User ID
   * @param completedSectionId ID of the completed section
   * @returns Promise with section unlock information
   */
  async scheduleSectionUnlock(
    userId: string,
    completedSectionId: string
  ): Promise<SectionUnlockInfoDto> {
    // Get completed section
    const completedSection = await this.gameSectionRepository.findOne({
      where: { id: completedSectionId }
    });
    
    if (!completedSection) {
      throw new NotFoundException(`Game section with ID ${completedSectionId} not found`);
    }
    
    // Find next section in the module
    const nextSection = await this.findNextSectionInModule(
      completedSection.moduleId,
      completedSection.orderIndex
    );
    
    if (!nextSection) {
      return { hasNextSection: false };
    }
    
    // Calculate unlock date based on waiting period
    const waitTimeHours = nextSection.waitTimeHours || 0;
    const unlockDate = new Date();
    unlockDate.setHours(unlockDate.getHours() + waitTimeHours);
    
    // Create or update unlock schedule entry
    const existingSchedule = await this.sectionUnlockRepository.findOne({
      where: {
        userId: userId,
        sectionId: nextSection.id
      }
    });
    
    if (existingSchedule) {
      // Update existing schedule
      existingSchedule.previousSectionId = completedSectionId;
      existingSchedule.unlockDate = unlockDate;
      existingSchedule.isUnlocked = waitTimeHours === 0;
      existingSchedule.updatedAt = new Date();
      await this.sectionUnlockRepository.save(existingSchedule);
    } else {
      // Create new schedule
      const unlockSchedule = this.sectionUnlockRepository.create({
        userId: userId,
        sectionId: nextSection.id,
        moduleId: nextSection.moduleId,
        previousSectionId: completedSectionId,
        unlockDate: unlockDate,
        isUnlocked: waitTimeHours === 0
      });
      await this.sectionUnlockRepository.save(unlockSchedule);
    }
    
    return {
      hasNextSection: true,
      nextSectionId: nextSection.id,
      nextSectionTitle: nextSection.title,
      unlockDate,
      waitTimeHours
    };
  }

  /**
   * Get all scheduled module unlocks for a user
   * @param userId User ID
   * @returns Promise with module unlock list
   */
  async getUserModuleUnlocks(userId: string): Promise<ModuleUnlockListDto> {
    const unlocks = await this.moduleUnlockRepository.find({
      where: { userId },
      relations: ['module', 'previousModule'],
      order: { unlockDate: 'ASC' }
    });
    
    return {
      unlocks: unlocks.map(unlock => ({
        moduleId: unlock.moduleId,
        moduleTitle: unlock.module?.title,
        previousModuleId: unlock.previousModuleId,
        previousModuleTitle: unlock.previousModule?.title,
        unlockDate: unlock.unlockDate,
        isUnlocked: unlock.isUnlocked,
        timeRemaining: this.calculateTimeRemaining(unlock.unlockDate)
      }))
    };
  }

  /**
   * Get all scheduled section unlocks for a user
   * @param userId User ID
   * @param moduleId Optional module ID to filter by
   * @returns Promise with section unlock list
   */
  async getUserSectionUnlocks(
    userId: string,
    moduleId?: string
  ): Promise<SectionUnlockListDto> {
    // Build query
    const query = this.sectionUnlockRepository
      .createQueryBuilder('unlock')
      .leftJoinAndSelect('unlock.section', 'section')
      .leftJoinAndSelect('unlock.module', 'module')
      .leftJoinAndSelect('unlock.previousSection', 'prevSection')
      .where('unlock.userId = :userId', { userId })
      .orderBy('unlock.unlockDate', 'ASC');
    
    if (moduleId) {
      query.andWhere('unlock.moduleId = :moduleId', { moduleId });
    }
    
    const unlocks = await query.getMany();
    
    return {
      unlocks: unlocks.map(unlock => ({
        sectionId: unlock.sectionId,
        sectionTitle: unlock.section?.title,
        moduleId: unlock.moduleId,
        moduleTitle: unlock.module?.title,
        previousSectionId: unlock.previousSectionId,
        previousSectionTitle: unlock.previousSection?.title,
        unlockDate: unlock.unlockDate,
        isUnlocked: unlock.isUnlocked,
        timeRemaining: this.calculateTimeRemaining(unlock.unlockDate)
      }))
    };
  }

  /**
   * Check if a user has access to a module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with module access result
   */
  async checkModuleAccess(userId: string, moduleId: string): Promise<ModuleAccessResultDto> {
    // Verify module exists
    const module = await this.gameModuleRepository.findOne({
      where: { id: moduleId }
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // If module is not active, deny access
    if (!module.isActive) {
      return {
        canAccess: false,
        reason: 'MODULE_INACTIVE'
      };
    }
    
    // If module has no prerequisite, grant access
    if (!module.prerequisiteModuleId) {
      return { canAccess: true };
    }
    
    // Check if prerequisite module is completed
    const prerequisiteCompleted = await this.isModuleCompleted(userId, module.prerequisiteModuleId);
    if (!prerequisiteCompleted) {
      return {
        canAccess: false,
        reason: 'PREREQUISITE_NOT_COMPLETED',
        prerequisiteModuleId: module.prerequisiteModuleId
      };
    }
    
    // Check unlock schedule
    const unlockSchedule = await this.moduleUnlockRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId
      }
    });
    
    if (!unlockSchedule) {
      // Create unlock schedule if it doesn't exist
      await this.scheduleModuleUnlock(userId, module.prerequisiteModuleId);
      return this.checkModuleAccess(userId, moduleId); // Recursive call with new schedule
    }
    
    if (!unlockSchedule.isUnlocked) {
      const currentTime = new Date();
      if (currentTime >= unlockSchedule.unlockDate) {
        // Auto unlock if time has passed
        unlockSchedule.isUnlocked = true;
        unlockSchedule.updatedAt = new Date();
        await this.moduleUnlockRepository.save(unlockSchedule);
        return { canAccess: true };
      } else {
        // Still waiting
        return {
          canAccess: false,
          reason: 'WAITING_PERIOD',
          unlockDate: unlockSchedule.unlockDate,
          timeRemaining: this.calculateTimeRemaining(unlockSchedule.unlockDate)
        };
      }
    }
    
    return { canAccess: true };
  }

  /**
   * Check if a user has access to a section
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with section access result
   */
  async checkSectionAccess(userId: string, sectionId: string): Promise<SectionAccessResultDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({
      where: { id: sectionId },
      relations: ['module']
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // If section is not active, deny access
    if (!section.isActive) {
      return {
        canAccess: false,
        reason: 'SECTION_INACTIVE'
      };
    }
    
    // Check module access first
    const moduleAccess = await this.checkModuleAccess(userId, section.moduleId);
    if (!moduleAccess.canAccess) {
      return {
        canAccess: false,
        reason: moduleAccess.reason,
        moduleAccessDetails: moduleAccess
      };
    }
    
    // Get previous section in the module
    const previousSection = await this.findPreviousSectionInModule(
      section.moduleId,
      section.orderIndex
    );
    
    // If first section in module, grant access
    if (!previousSection) {
      return { canAccess: true };
    }
    
    // Check if previous section is completed
    const previousSectionCompleted = await this.isSectionCompleted(userId, previousSection.id);
    if (!previousSectionCompleted) {
      return {
        canAccess: false,
        reason: 'PREVIOUS_SECTION_NOT_COMPLETED',
        previousSectionId: previousSection.id,
        previousSectionTitle: previousSection.title
      };
    }
    
    // If previous section has no waiting time, grant access
    if (previousSection.waitTimeHours <= 0) {
      return { canAccess: true };
    }
    
    // Check unlock schedule
    const unlockSchedule = await this.sectionUnlockRepository.findOne({
      where: {
        userId: userId,
        sectionId: sectionId
      }
    });
    
    if (!unlockSchedule) {
      // Create unlock schedule if it doesn't exist
      await this.scheduleSectionUnlock(userId, previousSection.id);
      return this.checkSectionAccess(userId, sectionId); // Recursive call with new schedule
    }
    
    if (!unlockSchedule.isUnlocked) {
      const currentTime = new Date();
      if (currentTime >= unlockSchedule.unlockDate) {
        // Auto unlock if time has passed
        unlockSchedule.isUnlocked = true;
        unlockSchedule.updatedAt = new Date();
        await this.sectionUnlockRepository.save(unlockSchedule);
        return { canAccess: true };
      } else {
        // Still waiting
        return {
          canAccess: false,
          reason: 'SECTION_WAITING_PERIOD',
          unlockDate: unlockSchedule.unlockDate,
          timeRemaining: this.calculateTimeRemaining(unlockSchedule.unlockDate)
        };
      }
    }
    
    return { canAccess: true };
  }

  /**
   * Expedite a module unlock (skip waiting period)
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with expedite result
   */
  async expediteModuleUnlock(userId: string, moduleId: string): Promise<ExpediteResultDto> {
    // Verify module exists
    const module = await this.gameModuleRepository.findOne({
      where: { id: moduleId }
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Check unlock schedule
    const unlockSchedule = await this.moduleUnlockRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId
      }
    });
    
    if (!unlockSchedule) {
      throw new BadRequestException(`No unlock schedule found for module ${moduleId}`);
    }
    
    // If already unlocked, return success
    if (unlockSchedule.isUnlocked) {
      return {
        success: true,
        alreadyUnlocked: true
      };
    }
    
    // Calculate how much time is remaining
    const currentTime = new Date();
    const timeRemaining = this.calculateTimeRemaining(unlockSchedule.unlockDate);
    
    // TODO: Implement payment integration here
    // const paymentRequired = this.calculatePaymentForExpedite(timeRemaining);
    // const paymentSuccess = await this.processPayment(userId, paymentRequired);
    
    // Mark as unlocked
    unlockSchedule.isUnlocked = true;
    unlockSchedule.updatedAt = new Date();
    await this.moduleUnlockRepository.save(unlockSchedule);
    
    // Send a notification
    await this.notificationService.sendImmediateUnlockNotification(userId, moduleId, 'expedited');
    
    return {
      success: true,
      alreadyUnlocked: false,
      timeSkipped: timeRemaining
    };
  }

  /**
   * Expedite a section unlock (skip waiting period)
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with expedite result
   */
  async expediteSectionUnlock(userId: string, sectionId: string): Promise<ExpediteResultDto> {
    // Verify section exists
    const section = await this.gameSectionRepository.findOne({
      where: { id: sectionId }
    });
    
    if (!section) {
      throw new NotFoundException(`Game section with ID ${sectionId} not found`);
    }
    
    // Check unlock schedule
    const unlockSchedule = await this.sectionUnlockRepository.findOne({
      where: {
        userId: userId,
        sectionId: sectionId
      }
    });
    
    if (!unlockSchedule) {
      throw new BadRequestException(`No unlock schedule found for section ${sectionId}`);
    }
    
    // If already unlocked, return success
    if (unlockSchedule.isUnlocked) {
      return {
        success: true,
        alreadyUnlocked: true
      };
    }
    
    // Calculate how much time is remaining
    const currentTime = new Date();
    const timeRemaining = this.calculateTimeRemaining(unlockSchedule.unlockDate);
    
    // TODO: Implement payment integration here
    // const paymentRequired = this.calculatePaymentForExpedite(timeRemaining);
    // const paymentSuccess = await this.processPayment(userId, paymentRequired);
    
    // Mark as unlocked
    unlockSchedule.isUnlocked = true;
    unlockSchedule.updatedAt = new Date();
    await this.sectionUnlockRepository.save(unlockSchedule);
    
    return {
      success: true,
      alreadyUnlocked: false,
      timeSkipped: timeRemaining
    };
  }

  /**
   * Check and update unlock status for all waiting modules
   * @param userId User ID
   * @returns Promise with update results
   */
  async checkAndUpdateUserModules(userId: string): Promise<ModuleUnlockUpdateResultDto> {
    const currentTime = new Date();
    
    // Find modules that should be unlocked now
    const moduleSchedules = await this.moduleUnlockRepository.find({
      where: {
        userId: userId,
        isUnlocked: false,
        unlockDate: /*<=*/ currentTime
      },
      relations: ['module']
    });
    
    // Update each one
    const unlockedModules = [];
    for (const schedule of moduleSchedules) {
      schedule.isUnlocked = true;
      schedule.updatedAt = currentTime;
      await this.moduleUnlockRepository.save(schedule);
      
      unlockedModules.push({
        moduleId: schedule.moduleId,
        moduleTitle: schedule.module?.title
      });
    }
    
    // Find sections that should be unlocked now
    const sectionSchedules = await this.sectionUnlockRepository.find({
      where: {
        userId: userId,
        isUnlocked: false,
        unlockDate: /*<=*/ currentTime
      },
      relations: ['section']
    });
    
    // Update each one
    const unlockedSections = [];
    for (const schedule of sectionSchedules) {
      schedule.isUnlocked = true;
      schedule.updatedAt = currentTime;
      await this.sectionUnlockRepository.save(schedule);
      
      unlockedSections.push({
        sectionId: schedule.sectionId,
        sectionTitle: schedule.section?.title,
        moduleId: schedule.moduleId
      });
    }
    
    return {
      unlockedModules,
      unlockedSections,
      checkedModules: moduleSchedules.length + sectionSchedules.length
    };
  }

  /**
   * Calculate time remaining until a date
   * @param unlockDate Date to calculate time remaining until
   * @returns Time remaining in hours, minutes, and seconds
   * @private
   */
  private calculateTimeRemaining(unlockDate: Date): TimeRemainingDto {
    const currentTime = new Date();
    const diffMs = unlockDate.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }

  /**
   * Find the next module after a completed module
   * @param completedModuleId ID of the completed module
   * @returns Promise with next module or null if none
   * @private
   */
  private async findNextModule(completedModuleId: string): Promise<GameModule | null> {
    // First check modules that have this as prerequisite
    const modulesWithPrereq = await this.gameModuleRepository.find({
      where: {
        prerequisiteModuleId: completedModuleId,
        isActive: true
      },
      order: { orderIndex: 'ASC' }
    });
    
    if (modulesWithPrereq.length > 0) {
      return modulesWithPrereq[0];
    }
    
    // If no direct prerequisites, find the next module by order index
    const completedModule = await this.gameModuleRepository.findOne({
      where: { id: completedModuleId }
    });
    
    if (!completedModule) {
      return null;
    }
    
    const nextModule = await this.gameModuleRepository.findOne({
      where: {
        orderIndex: completedModule.orderIndex + 1,
        isActive: true
      }
    });
    
    return nextModule;
  }

  /**
   * Find the next section in a module
   * @param moduleId Module ID
   * @param currentOrderIndex Current section order index
   * @returns Promise with next section or null if none
   * @private
   */
  private async findNextSectionInModule(
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
   * Find the previous section in a module
   * @param moduleId Module ID
   * @param currentOrderIndex Current section order index
   * @returns Promise with previous section or null if none
   * @private
   */
  private async findPreviousSectionInModule(
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
   * Check if a module is completed by a user
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with boolean indicating if module is completed
   * @private
   */
  private async isModuleCompleted(userId: string, moduleId: string): Promise<boolean> {
    const progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        sectionId: null
      }
    });
    
    return progress?.status === 'completed';
  }

  /**
   * Check if a section is completed by a user
   * @param userId User ID
   * @param sectionId Section ID
   * @returns Promise with boolean indicating if section is completed
   * @private
   */
  private async isSectionCompleted(userId: string, sectionId: string): Promise<boolean> {
    const section = await this.gameSectionRepository.findOne({
      where: { id: sectionId }
    });
    
    if (!section) {
      return false;
    }
    
    const progress = await this.userProgressRepository.findOne({
      where: {
        userId: userId,
        moduleId: section.moduleId,
        sectionId: sectionId
      }
    });
    
    return progress?.status === 'completed';
  }
}