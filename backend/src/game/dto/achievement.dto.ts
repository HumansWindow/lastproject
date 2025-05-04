import { ApiProperty } from '@nestjs/swagger';

export class AchievementDto {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  name: string;
  
  @ApiProperty()
  description: string;
  
  @ApiProperty()
  imageUrl: string;
  
  @ApiProperty()
  points: number;
  
  @ApiProperty()
  requirements: string;
  
  @ApiProperty()
  isActive: boolean;
}

export class UserAchievementDto {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  userId: string;
  
  @ApiProperty()
  achievementId: string;
  
  @ApiProperty()
  achievement: AchievementDto;
  
  @ApiProperty()
  unlockedAt: Date;
}

export class AchievementUnlockDto {
  @ApiProperty()
  achievement: AchievementDto;
  
  @ApiProperty()
  isNew: boolean;
  
  @ApiProperty()
  unlockedAt: Date;
}