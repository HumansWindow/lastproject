import { v4 as uuidv4 } from 'uuid';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, In } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { AchievementDto, AchievementUnlockDto, UserAchievementDto } from '../dto/achievement.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AchievementUnlockedEvent } from '../events/achievement-unlocked.event';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class GameAchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Get all available achievements
   * @returns Promise with array of achievement DTOs
   */
  async getAllAchievements(): Promise<AchievementDto[]> {
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' }
    });
    
    return achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      imageUrl: achievement.imageUrl,
      points: achievement.points,
      requirements: achievement.requirements,
      isActive: achievement.isActive
    }));
  }

  /**
   * Get all achievements for a specific user
   * @param userId User ID
   * @returns Promise with array of user achievement DTOs
   */
  async getUserAchievements(userId: string): Promise<UserAchievementDto[]> {
    // Get all achievements
    const allAchievements = await this.achievementRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' }
    });
    
    // Get user's unlocked achievements
    const userAchievements = await this.userAchievementRepository.find({
      where: { userId: userId },
      relations: ['achievement']
    });
    
    // Map to DTOs, including achievements not yet unlocked
    return allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId === achievement.id
      );
      
      return {
        id: userAchievement?.id || uuidv4(), // Generate an ID if not unlocked yet
        userId: userId,
        achievementId: achievement.id,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.imageUrl,
          points: achievement.points,
          requirements: achievement.requirements,
          isActive: achievement.isActive
        },
        unlockedAt: userAchievement?.unlockedAt || null
      };
    });
  }

  /**
   * Unlock an achievement for a user
   * @param userId User ID
   * @param unlockDto Achievement unlock data
   * @returns Promise with unlocked achievement DTO
   */
  async unlockAchievement(
    userId: string, 
    unlockDto: AchievementUnlockDto
  ): Promise<UserAchievementDto> {
    // Extract achievement ID from the DTO's achievement property
    const achievementId = typeof unlockDto.achievement === 'string' 
      ? unlockDto.achievement 
      : unlockDto.achievement.id;
    
    // Check if achievement exists
    const achievement = await this.achievementRepository.findOne({
      where: { id: achievementId }
    });
    
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${achievementId} not found`);
    }
    
    // Check if user already has this achievement
    const existingAchievement = await this.userAchievementRepository.findOne({
      where: {
        userId: userId,
        achievementId: achievementId
      }
    });
    
    if (existingAchievement) {
      // Already unlocked, return it
      return {
        id: existingAchievement.id,
        userId: userId,
        achievementId: achievement.id,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.imageUrl,
          points: achievement.points,
          requirements: achievement.requirements,
          isActive: achievement.isActive
        },
        unlockedAt: existingAchievement.unlockedAt
      };
    }
    
    // Create new user achievement
    const userAchievement = this.userAchievementRepository.create({
      userId: userId,
      achievementId: achievementId,
      unlockedAt: new Date()
    });
    
    const savedUserAchievement = await this.userAchievementRepository.save(userAchievement);
    
    // Emit achievement unlocked event with proper constructor
    const event = new AchievementUnlockedEvent(
      savedUserAchievement,
      true // isNew flag
    );
    
    this.eventEmitter.emit('achievement.unlocked', event);
    
    return {
      id: savedUserAchievement.id,
      userId: userId,
      achievementId: achievement.id,
      achievement: {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        imageUrl: achievement.imageUrl,
        points: achievement.points,
        requirements: achievement.requirements,
        isActive: achievement.isActive
      },
      unlockedAt: savedUserAchievement.unlockedAt
    };
  }

  /**
   * Check and unlock achievements based on user points
   * @param userId User ID
   * @param points Current point total
   * @returns Promise with array of newly unlocked achievements
   */
  async checkAndUnlockAchievements(
    userId: string, 
    points: number
  ): Promise<UserAchievementDto[]> {
    // Get point-based achievements that the user hasn't unlocked yet
    const unlockedAchievementIds = (
      await this.userAchievementRepository.find({
        where: { userId: userId },
        select: ['achievementId']
      })
    ).map(ua => ua.achievementId);
    
    // Find achievements that can be unlocked with current points
    const achievementsToUnlock = await this.achievementRepository.find({
      where: {
        points: LessThanOrEqual(points),
        isActive: true,
        id: unlockedAchievementIds.length > 0 ? Not(In(unlockedAchievementIds)) : undefined
      }
    });
    
    if (achievementsToUnlock.length === 0) {
      return [];
    }
    
    // Unlock each achievement
    const unlocked = await Promise.all(
      achievementsToUnlock.map(async (achievement) => {
        // Create a proper AchievementDto to pass to unlockAchievement
        const achievementDto: AchievementDto = {
          id: achievement.id,
          name: achievement.name, 
          description: achievement.description,
          imageUrl: achievement.imageUrl,
          points: achievement.points,
          requirements: achievement.requirements,
          isActive: achievement.isActive
        };
        
        // Create a proper unlock DTO
        const unlockDto: AchievementUnlockDto = {
          achievement: achievementDto,
          isNew: true,
          unlockedAt: new Date()
        };
        
        return this.unlockAchievement(userId, unlockDto);
      })
    );
    
    return unlocked;
  }

  /**
   * Get achievements by category
   * @param category Achievement category
   * @returns Promise with array of achievement DTOs
   */
  async getAchievementsByCategory(category: string): Promise<AchievementDto[]> {
    // Since the Achievement entity doesn't have a category field,
    // we would need to modify the entity or handle this differently.
    // For now, we'll return all achievements as a workaround
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' }
    });
    
    // In a real implementation, we would filter by category
    return achievements.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      imageUrl: achievement.imageUrl,
      points: achievement.points,
      requirements: achievement.requirements,
      isActive: achievement.isActive
    }));
  }

  /**
   * Get achievement details
   * @param achievementId Achievement ID
   * @returns Promise with achievement DTO
   */
  async getAchievementDetails(achievementId: string): Promise<AchievementDto> {
    const achievement = await this.achievementRepository.findOne({
      where: { id: achievementId }
    });
    
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${achievementId} not found`);
    }
    
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      imageUrl: achievement.imageUrl,
      points: achievement.points,
      requirements: achievement.requirements,
      isActive: achievement.isActive
    };
  }

  /**
   * Check if a user has unlocked a specific achievement
   * @param userId User ID
   * @param achievementId Achievement ID
   * @returns Promise with boolean indicating if achievement is unlocked
   */
  async hasUnlockedAchievement(
    userId: string,
    achievementId: string
  ): Promise<boolean> {
    const count = await this.userAchievementRepository.count({
      where: {
        userId: userId,
        achievementId: achievementId
      }
    });
    
    return count > 0;
  }

  /**
   * Get user's recently unlocked achievements
   * @param userId User ID
   * @param limit Maximum number of achievements to return
   * @returns Promise with array of recently unlocked achievement DTOs
   */
  async getRecentAchievements(
    userId: string, 
    limit: number = 5
  ): Promise<UserAchievementDto[]> {
    const recentAchievements = await this.userAchievementRepository.find({
      where: { userId: userId },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
      take: limit
    });
    
    return recentAchievements.map(userAchievement => {
      const achievement = userAchievement.achievement;
      
      return {
        id: userAchievement.id,
        userId: userId,
        achievementId: achievement.id,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          imageUrl: achievement.imageUrl,
          points: achievement.points,
          requirements: achievement.requirements,
          isActive: achievement.isActive
        },
        unlockedAt: userAchievement.unlockedAt
      };
    });
  }

  /**
   * Get user achievement summary
   * @param userId User ID
   * @returns Promise with achievement summary stats
   */
  async getUserAchievementSummary(userId: string): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    percentageComplete: number;
    recentlyUnlocked: UserAchievementDto[];
  }> {
    // Get total active achievements
    const totalAchievements = await this.achievementRepository.count({
      where: { isActive: true }
    });
    
    // Get count of user's unlocked achievements
    const unlockedAchievements = await this.userAchievementRepository.count({
      where: { userId: userId }
    });
    
    // Calculate percentage
    const percentageComplete = totalAchievements > 0
      ? Math.round((unlockedAchievements / totalAchievements) * 100)
      : 0;
    
    // Get recently unlocked achievements
    const recentlyUnlocked = await this.getRecentAchievements(userId, 3);
    
    return {
      totalAchievements,
      unlockedAchievements,
      percentageComplete,
      recentlyUnlocked
    };
  }
}