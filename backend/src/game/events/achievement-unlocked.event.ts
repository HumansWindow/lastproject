import { UserAchievement } from '../entities/user-achievement.entity';

export class AchievementUnlockedEvent {
  constructor(
    public readonly userAchievement: UserAchievement,
    public readonly isNew: boolean = true
  ) {}
}