import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, MoreThan } from 'typeorm';
import { UserProgress } from '../entities/user-progress.entity';
import { SectionCheckpoint } from '../entities/section-checkpoint.entity';
import { UpdateUserProgressDto } from '../dto/progress.dto';

@Injectable()
export class UserProgressRepository {
  constructor(
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    @InjectRepository(SectionCheckpoint)
    private readonly sectionCheckpointRepository: Repository<SectionCheckpoint>,
  ) {}

  /**
   * Find user progress by user ID and module ID
   */
  async findByUserAndModule(userId: string, moduleId: string): Promise<UserProgress | null> {
    return this.userProgressRepository.findOne({
      where: { userId, moduleId },
      relations: ['lastSection'],
    });
  }

  /**
   * Find all progress entries for a user
   */
  async findByUser(
    userId: string,
    options?: {
      isCompleted?: boolean;
      skip?: number;
      take?: number;
    },
  ): Promise<[UserProgress[], number]> {
    const where: FindOptionsWhere<UserProgress> = { userId };

    if (options?.isCompleted !== undefined) {
      where.isCompleted = options.isCompleted;
    }

    return this.userProgressRepository.findAndCount({
      where,
      relations: ['lastSection', 'module'],
      skip: options?.skip,
      take: options?.take,
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * Create or update user progress for a module
   */
  async createOrUpdate(
    userId: string,
    moduleId: string,
    data: Partial<UserProgress>,
  ): Promise<UserProgress> {
    const existingProgress = await this.findByUserAndModule(userId, moduleId);

    if (existingProgress) {
      await this.userProgressRepository.update(existingProgress.id, data);
      return this.findByUserAndModule(userId, moduleId);
    } else {
      const newProgress = this.userProgressRepository.create({
        userId,
        moduleId,
        sectionsCompleted: 0,
        isCompleted: false,
        rewardClaimed: false,
        ...data,
      });
      return this.userProgressRepository.save(newProgress);
    }
  }

  /**
   * Update user progress
   */
  async updateProgress(
    id: string,
    updateUserProgressDto: UpdateUserProgressDto,
  ): Promise<UserProgress> {
    await this.userProgressRepository.update(id, updateUserProgressDto);
    return this.userProgressRepository.findOne({
      where: { id },
      relations: ['lastSection'],
    });
  }

  /**
   * Mark a module as completed
   */
  async markAsCompleted(
    userId: string,
    moduleId: string,
  ): Promise<UserProgress> {
    const now = new Date();
    return this.createOrUpdate(userId, moduleId, {
      isCompleted: true,
      completionDate: now,
    });
  }

  /**
   * Mark a module's rewards as claimed
   */
  async markRewardClaimed(
    userId: string,
    moduleId: string,
  ): Promise<UserProgress> {
    const now = new Date();
    return this.createOrUpdate(userId, moduleId, {
      rewardClaimed: true,
      rewardClaimDate: now,
    });
  }

  /**
   * Check if a module is completed by a user
   */
  async isModuleCompleted(userId: string, moduleId: string): Promise<boolean> {
    const progress = await this.findByUserAndModule(userId, moduleId);
    return !!progress?.isCompleted;
  }

  /**
   * Check if a module's reward has been claimed by a user
   */
  async isRewardClaimed(userId: string, moduleId: string): Promise<boolean> {
    const progress = await this.findByUserAndModule(userId, moduleId);
    return !!progress?.rewardClaimed;
  }

  /**
   * Update section completion count for a module
   */
  async updateSectionsCompleted(userId: string, moduleId: string): Promise<UserProgress> {
    // Count completed sections for this module and user
    const completedSections = await this.sectionCheckpointRepository.count({
      where: {
        userId,
        section: {
          moduleId,
        },
        isCompleted: true,
      },
    });

    return this.createOrUpdate(userId, moduleId, {
      sectionsCompleted: completedSections,
    });
  }

  /**
   * Update last visited section for a module
   */
  async updateLastSection(
    userId: string,
    moduleId: string,
    sectionId: string,
  ): Promise<UserProgress> {
    return this.createOrUpdate(userId, moduleId, {
      lastSectionId: sectionId,
    });
  }

  /**
   * Find completed modules for a user
   */
  async findCompletedModules(userId: string): Promise<UserProgress[]> {
    return this.userProgressRepository.find({
      where: {
        userId,
        isCompleted: true,
      },
      relations: ['module', 'lastSection'],
      order: {
        completionDate: 'DESC',
      },
    });
  }

  /**
   * Count completed modules for a user
   */
  async countCompletedModules(userId: string): Promise<number> {
    return this.userProgressRepository.count({
      where: {
        userId,
        isCompleted: true,
      },
    });
  }

  /**
   * Find in-progress modules (started but not completed) for a user
   */
  async findInProgressModules(userId: string): Promise<UserProgress[]> {
    return this.userProgressRepository.find({
      where: {
        userId,
        isCompleted: false,
        sectionsCompleted: MoreThan(0),
      },
      relations: ['module', 'lastSection'],
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * Find users who have completed specific modules
   */
  async findUsersByCompletedModules(moduleIds: string[]): Promise<string[]> {
    // Get distinct user IDs who have completed any of the specified modules
    const results = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select('DISTINCT progress.userId', 'userId')
      .where('progress.moduleId IN (:...moduleIds)', { moduleIds })
      .andWhere('progress.isCompleted = :isCompleted', { isCompleted: true })
      .getRawMany();

    return results.map((result) => result.userId);
  }

  /**
   * Delete progress data for a user
   */
  async deleteUserData(userId: string): Promise<void> {
    await this.userProgressRepository.delete({ userId });
  }
}