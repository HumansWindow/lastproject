import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class UserProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  sectionsCompleted: number;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completionDate?: Date;

  @ApiProperty()
  rewardClaimed: boolean;

  @ApiPropertyOptional()
  rewardClaimDate?: Date;

  @ApiPropertyOptional()
  lastSectionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserProgressListDto {
  @ApiProperty({ type: [UserProgressDto] })
  progress: UserProgressDto[];

  @ApiProperty()
  totalCount: number;
}

export class UpdateUserProgressDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sectionsCompleted?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  completionDate?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  rewardClaimed?: boolean;

  @ApiPropertyOptional()
  @IsDate()
  @IsOptional()
  rewardClaimDate?: Date;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  lastSectionId?: string;
}

export class SectionCheckpointDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completionDate?: Date;

  @ApiPropertyOptional()
  @IsObject()
  responses?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  timeSpent?: number; // Time spent in seconds

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateSectionCheckpointDto {
  @ApiProperty()
  @IsUUID()
  sectionId: string;

  @ApiProperty()
  @IsBoolean()
  isCompleted: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  responses?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeSpent?: number; // Time spent in seconds
}

export class UpdateSectionCheckpointDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  responses?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}

export class UserModuleProgressDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;

  @ApiProperty()
  progress: number; // percentage 0-100

  @ApiProperty()
  sectionsCompleted: number;

  @ApiProperty()
  totalSections: number;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completionDate?: Date;

  @ApiProperty()
  rewardClaimed: boolean;

  @ApiPropertyOptional()
  rewardClaimDate?: Date;

  @ApiPropertyOptional()
  lastSectionId?: string;

  @ApiPropertyOptional()
  lastSectionTitle?: string;
}

export class UserOverallProgressDto {
  @ApiProperty()
  totalModules: number;

  @ApiProperty()
  completedModules: number;

  @ApiProperty()
  moduleProgress: UserModuleProgressDto[];

  @ApiProperty()
  totalRewardsClaimed: number;
}

export class SectionCompletionResultDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  completed: boolean;

  @ApiProperty()
  nextSection: {
    hasNextSection: boolean;
    nextSectionId?: string;
    nextSectionTitle?: string;
    unlockDate?: Date;
    waitTimeHours?: number;
  };

  @ApiPropertyOptional()
  moduleCompletion?: {
    moduleId: string;
    completed: boolean;
    reward?: any;
    nextModule?: any;
  };
}

export class UserSectionProgressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CheckpointCompletionDto {
  @ApiProperty()
  @IsString()
  sectionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  checkpointType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentId?: string;

  @ApiProperty()
  @IsBoolean()
  isCompleted: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  responses?: Record<string, any>;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}

export class UserModuleProgressItemDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;

  @ApiProperty()
  progress: number; // percentage 0-100

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completionDate?: Date;
}

export class UserProgressSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  lastUpdatedAt?: Date;

  @ApiProperty()
  completionPercentage: number;

  @ApiProperty()
  sections: any[];

  @ApiProperty()
  isNextModuleUnlocked: boolean;

  @ApiProperty({ type: [UserModuleProgressItemDto] })
  modules: UserModuleProgressItemDto[];
}