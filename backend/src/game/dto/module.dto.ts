import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { GameSectionDto } from './section.dto';

export class CreateGameModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Module description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Order index for positioning in the module list' })
  @IsNumber()
  @Min(0)
  orderIndex: number;

  @ApiPropertyOptional({ description: 'Whether the module is active and visible to users' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID of prerequisite module that must be completed first' })
  @IsUUID()
  @IsOptional()
  prerequisiteModuleId?: string;

  @ApiPropertyOptional({ description: 'Estimated time to complete the module (in minutes)' })
  @IsNumber()
  @IsOptional()
  timeToComplete?: number;

  @ApiPropertyOptional({ description: 'Waiting time in hours before next module unlocks' })
  @IsNumber()
  @IsOptional()
  waitTimeHours?: number;

  @ApiPropertyOptional({ description: 'Reward amount for completing this module' })
  @IsNumber()
  @IsOptional()
  rewardAmount?: number;
}

export class UpdateGameModuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  prerequisiteModuleId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeToComplete?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  waitTimeHours?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rewardAmount?: number;
}

export class GameModuleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  prerequisiteModuleId?: string;

  @ApiPropertyOptional()
  timeToComplete?: number;

  @ApiPropertyOptional()
  waitTimeHours?: number;

  @ApiPropertyOptional()
  rewardAmount?: number;
  
  @ApiProperty()
  createdAt: Date;
  
  @ApiProperty()
  updatedAt: Date;
}

export class GameModuleListDto {
  @ApiProperty({ type: [GameModuleDto] })
  modules: GameModuleDto[];
  
  @ApiProperty()
  totalCount: number;
}

export class GameModuleSummaryDto {
  @ApiProperty()
  id: string;
  
  @ApiProperty()
  title: string;
  
  @ApiProperty()
  description: string;
  
  @ApiProperty()
  orderIndex: number;
  
  @ApiProperty()
  isActive: boolean;
  
  @ApiPropertyOptional()
  prerequisiteModuleId?: string;
  
  @ApiPropertyOptional()
  timeToComplete?: number;
}

export class GameModuleWithSectionsDto extends GameModuleDto {
  @ApiProperty({ type: [GameSectionDto], description: 'Sections in this module' })
  sections: GameSectionDto[]; // Fixed: properly typed as GameSectionDto[] instead of any[]
  
  @ApiProperty()
  totalSections: number;
  
  @ApiPropertyOptional()
  completedSections?: number;
  
  @ApiPropertyOptional()
  progressPercentage?: number;
}