import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { ModuleUnlockSchedule } from '../entities/module-unlock-schedule.entity';
import { SectionUnlockSchedule } from '../entities/section-unlock-schedule.entity';

@Injectable()
export class ModuleUnlockRepository {
  constructor(
    @InjectRepository(ModuleUnlockSchedule)
    private readonly moduleUnlockRepository: Repository<ModuleUnlockSchedule>,
    @InjectRepository(SectionUnlockSchedule)
    private readonly sectionUnlockRepository: Repository<SectionUnlockSchedule>,
  ) {}

  /**
   * Find module unlock schedule by ID
   */
  async findOne(id: string): Promise<ModuleUnlockSchedule | null> {
    return this.moduleUnlockRepository.findOne({
      where: { id },
      relations: ['module', 'previousModule'],
    });
  }

  /**
   * Find module unlock schedule by user and module ID
   */
  async findByUserAndModule(
    userId: string,
    moduleId: string,
  ): Promise<ModuleUnlockSchedule | null> {
    return this.moduleUnlockRepository.findOne({
      where: {
        userId,
        moduleId,
      },
      relations: ['module', 'previousModule'],
    });
  }

  /**
   * Create or update module unlock schedule
   */
  async createOrUpdate(data: Partial<ModuleUnlockSchedule>): Promise<ModuleUnlockSchedule> {
    if (!data.userId || !data.moduleId) {
      throw new Error('User ID and module ID are required');
    }

    const existing = await this.findByUserAndModule(data.userId, data.moduleId);

    if (existing) {
      await this.moduleUnlockRepository.update(existing.id, data);
      return this.findByUserAndModule(data.userId, data.moduleId);
    } else {
      const newSchedule = this.moduleUnlockRepository.create(data);
      return this.moduleUnlockRepository.save(newSchedule);
    }
  }

  /**
   * Find all unlock schedules for a user
   */
  async findByUser(userId: string): Promise<ModuleUnlockSchedule[]> {
    return this.moduleUnlockRepository.find({
      where: { userId },
      relations: ['module', 'previousModule'],
      order: {
        unlockDate: 'ASC',
      },
    });
  }

  /**
   * Find upcoming unlocks for a user (modules not yet unlocked)
   */
  async findUpcomingUnlocks(userId: string): Promise<ModuleUnlockSchedule[]> {
    return this.moduleUnlockRepository.find({
      where: {
        userId,
        isUnlocked: false,
      },
      relations: ['module', 'previousModule'],
      order: {
        unlockDate: 'ASC',
      },
    });
  }

  /**
   * Find modules that should be unlocked now based on time
   */
  async findReadyToUnlock(): Promise<ModuleUnlockSchedule[]> {
    const now = new Date();
    return this.moduleUnlockRepository.find({
      where: {
        unlockDate: LessThanOrEqual(now),
        isUnlocked: false,
      },
      relations: ['module', 'previousModule'],
    });
  }

  /**
   * Find modules ready to unlock for a specific user
   */
  async findUserReadyToUnlock(userId: string): Promise<ModuleUnlockSchedule[]> {
    const now = new Date();
    return this.moduleUnlockRepository.find({
      where: {
        userId,
        unlockDate: LessThanOrEqual(now),
        isUnlocked: false,
      },
      relations: ['module', 'previousModule'],
    });
  }

  /**
   * Mark a module as unlocked
   */
  async markAsUnlocked(id: string): Promise<ModuleUnlockSchedule> {
    await this.moduleUnlockRepository.update(id, {
      isUnlocked: true,
    });
    return this.findOne(id);
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(id: string): Promise<ModuleUnlockSchedule> {
    await this.moduleUnlockRepository.update(id, {
      notificationSent: true,
    });
    return this.findOne(id);
  }

  /**
   * Update unlock date for a module
   */
  async updateUnlockDate(
    id: string,
    newUnlockDate: Date,
  ): Promise<ModuleUnlockSchedule> {
    await this.moduleUnlockRepository.update(id, {
      unlockDate: newUnlockDate,
    });
    return this.findOne(id);
  }

  /**
   * Find section unlock schedule by ID
   */
  async findSectionUnlock(id: string): Promise<SectionUnlockSchedule | null> {
    return this.sectionUnlockRepository.findOne({
      where: { id },
      relations: ['section', 'previousSection', 'module'],
    });
  }

  /**
   * Find section unlock schedule by user and section ID
   */
  async findSectionUnlockByUserAndSection(
    userId: string,
    sectionId: string,
  ): Promise<SectionUnlockSchedule | null> {
    return this.sectionUnlockRepository.findOne({
      where: {
        userId,
        sectionId,
      },
      relations: ['section', 'previousSection', 'module'],
    });
  }

  /**
   * Create or update section unlock schedule
   */
  async createOrUpdateSectionUnlock(
    data: Partial<SectionUnlockSchedule>,
  ): Promise<SectionUnlockSchedule> {
    if (!data.userId || !data.sectionId) {
      throw new Error('User ID and section ID are required');
    }

    const existing = await this.findSectionUnlockByUserAndSection(
      data.userId,
      data.sectionId,
    );

    if (existing) {
      await this.sectionUnlockRepository.update(existing.id, data);
      return this.findSectionUnlockByUserAndSection(data.userId, data.sectionId);
    } else {
      const newSchedule = this.sectionUnlockRepository.create(data);
      return this.sectionUnlockRepository.save(newSchedule);
    }
  }

  /**
   * Find section unlocks for a user (optionally filtered by module)
   */
  async findSectionUnlocksByUser(
    userId: string,
    moduleId?: string,
  ): Promise<SectionUnlockSchedule[]> {
    const where: FindOptionsWhere<SectionUnlockSchedule> = { userId };

    if (moduleId) {
      where.moduleId = moduleId;
    }

    return this.sectionUnlockRepository.find({
      where,
      relations: ['section', 'previousSection', 'module'],
      order: {
        unlockDate: 'ASC',
      },
    });
  }

  /**
   * Find upcoming section unlocks for a user
   */
  async findUpcomingSectionUnlocks(userId: string): Promise<SectionUnlockSchedule[]> {
    return this.sectionUnlockRepository.find({
      where: {
        userId,
        isUnlocked: false,
      },
      relations: ['section', 'previousSection', 'module'],
      order: {
        unlockDate: 'ASC',
      },
    });
  }

  /**
   * Find sections that should be unlocked now based on time
   */
  async findSectionsReadyToUnlock(): Promise<SectionUnlockSchedule[]> {
    const now = new Date();
    return this.sectionUnlockRepository.find({
      where: {
        unlockDate: LessThanOrEqual(now),
        isUnlocked: false,
      },
      relations: ['section', 'previousSection', 'module'],
    });
  }

  /**
   * Mark a section as unlocked
   */
  async markSectionAsUnlocked(id: string): Promise<SectionUnlockSchedule> {
    await this.sectionUnlockRepository.update(id, {
      isUnlocked: true,
    });
    return this.findSectionUnlock(id);
  }

  /**
   * Delete unlock schedules for a user
   */
  async deleteUserData(userId: string): Promise<void> {
    await this.moduleUnlockRepository.delete({ userId });
    await this.sectionUnlockRepository.delete({ userId });
  }
}