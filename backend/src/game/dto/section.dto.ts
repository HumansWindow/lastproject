import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SectionConfigInterface } from '../interfaces/section-config.interface';

export enum SectionType {
  TEXT_IMAGE = 'text-image',
  CARD_CAROUSEL = 'card-carousel',
  TIMELINE = 'timeline',
  QUIZ = 'quiz',
  INTERACTIVE = 'interactive'
}

export enum BackgroundType {
  DEFAULT = 'default',
  GALAXY = 'galaxy',
  GRADIENT = 'gradient',
  CUSTOM = 'custom'
}

export class CreateSectionContentDto {
  @ApiProperty()
  @IsString()
  contentType: string;

  @ApiProperty()
  content: any;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class CreateGameSectionDto {
  @ApiProperty({ description: 'Module ID this section belongs to' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'Section title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Type of section', enum: SectionType })
  @IsEnum(SectionType)
  sectionType: SectionType;

  @ApiProperty({ description: 'Order index for positioning within the module' })
  @IsNumber()
  @Min(0)
  orderIndex: number;

  @ApiPropertyOptional({ description: 'Background style', enum: BackgroundType, default: BackgroundType.DEFAULT })
  @IsEnum(BackgroundType)
  @IsOptional()
  backgroundType?: BackgroundType;

  @ApiProperty({ description: 'Section-specific configuration as JSON' })
  @IsObject()
  configuration: SectionConfigInterface;

  @ApiPropertyOptional({ description: 'Whether the section is active and visible to users' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Waiting time in hours before next section unlocks' })
  @IsNumber()
  @IsOptional()
  waitTimeHours?: number;
  
  @ApiPropertyOptional({ description: 'Initial content for the section', type: [CreateSectionContentDto] })
  @IsOptional()
  initialContent?: CreateSectionContentDto[];
}

export class UpdateGameSectionDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsEnum(SectionType)
  @IsOptional()
  sectionType?: SectionType;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional()
  @IsEnum(BackgroundType)
  @IsOptional()
  backgroundType?: BackgroundType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  configuration?: SectionConfigInterface;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  waitTimeHours?: number;
}

export class GameSectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;
  
  @ApiProperty()
  moduleName?: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: SectionType })
  sectionType: SectionType;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ enum: BackgroundType })
  backgroundType: BackgroundType;

  @ApiProperty()
  configuration: SectionConfigInterface;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  waitTimeHours?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GameSectionListDto {
  @ApiProperty({ type: [GameSectionDto] })
  sections: GameSectionDto[];

  @ApiProperty()
  totalCount: number;
  
  @ApiProperty()
  moduleId?: string;
}

export class SectionContentItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  orderIndex: number;
}

export class SectionWithContentDto extends GameSectionDto {
  @ApiProperty({ type: [SectionContentItemDto] })
  content: SectionContentItemDto[];
}

export class MediaAssetReferenceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  altText?: string;

  @ApiProperty()
  mimeType: string;
}

export class SectionContentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sectionId: string;
  
  @ApiProperty()
  contentType: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  orderIndex: number;
  
  @ApiPropertyOptional()
  createdAt?: Date;
  
  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class UpdateSectionContentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  content?: any;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class SectionNavigationItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ enum: SectionType })
  sectionType: SectionType;

  @ApiProperty({ enum: ['accessible', 'locked', 'completed'] })
  accessStatus: 'accessible' | 'locked' | 'completed';

  @ApiProperty()
  completionPercentage: number;
}

export class NavigationResultDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  moduleTitle: string;

  @ApiProperty({ type: [SectionNavigationItemDto] })
  sections: SectionNavigationItemDto[];

  @ApiProperty({ nullable: true })
  currentSectionId: string | null;

  @ApiProperty({ nullable: true })
  nextSectionId: string | null;

  @ApiProperty({ nullable: true })
  previousSectionId: string | null;
}