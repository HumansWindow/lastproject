import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, ValidateNested, IsUUID, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { SectionContentType } from '../interfaces/content-types.interface';

export class VersionHistoryDto {
  @ApiProperty({ description: 'Version ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Version number' })
  @IsNumber()
  versionNumber: number;

  @ApiProperty({ description: 'User who made the change' })
  @IsString()
  changedBy: string;

  @ApiProperty({ description: 'Description of the change' })
  @IsOptional()
  @IsString()
  changeDescription?: string;

  @ApiProperty({ description: 'Date when the version was created' })
  createdAt: Date;
}

export class MediaReferenceDto {
  @ApiProperty({ description: 'Media asset ID' })
  @IsUUID()
  assetId: string;

  @ApiPropertyOptional({ description: 'Display options for the media' })
  @IsOptional()
  @IsObject()
  displayOptions?: Record<string, any>;
}

export class SectionContentDto {
  @ApiProperty({ description: 'Content ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Section ID this content belongs to' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Content type', enum: SectionContentType })
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Content data' })
  @IsObject()
  content: any;

  @ApiProperty({ description: 'Display order within the section' })
  @IsNumber()
  orderIndex: number;

  @ApiPropertyOptional({ description: 'Creation date' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Last update date' })
  updatedAt?: Date;
}

export class CreateSectionContentDto {
  @ApiProperty({ description: 'Section ID this content belongs to' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Content type', enum: SectionContentType })
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Content data' })
  @IsObject()
  content: any;

  @ApiPropertyOptional({ description: 'Display order within the section' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Template ID to use for content creation' })
  @IsOptional()
  @IsUUID()
  templateId?: string;
}

export class UpdateSectionContentDto {
  @ApiPropertyOptional({ description: 'Content type', enum: SectionContentType })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Content data' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ description: 'Display order within the section' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Description of the changes made' })
  @IsOptional()
  @IsString()
  changeDescription?: string;
}

export class ReorderContentDto {
  @ApiProperty({ description: 'Content IDs in the desired order' })
  @IsArray()
  @ArrayMinSize(1)
  contentIds: string[];
}

export class BulkContentOperationDto {
  @ApiProperty({ description: 'Content items for bulk operation' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionContentDto)
  items: CreateSectionContentDto[];
}

export class ContentStatisticsResponseDto {
  @ApiProperty({ description: 'Total number of content items' })
  totalItems: number;
  
  @ApiProperty({ description: 'Content items broken down by type' })
  byType: { [key: string]: number };
  
  @ApiProperty({ description: 'Most viewed content' })
  mostViewed: { id: string; title: string; views: number };
  
  @ApiProperty({ description: 'Average time spent on content (seconds)' })
  averageTimeSpent: number;
}

export class ContentFilterDto {
  @ApiPropertyOptional({ description: 'Section ID to filter by' })
  @IsOptional()
  @IsUUID()
  sectionId?: string;
  
  @ApiPropertyOptional({ description: 'Content type to filter by' })
  @IsOptional()
  @IsString()
  contentType?: string;
  
  @ApiPropertyOptional({ description: 'Search term to filter by' })
  @IsOptional()
  @IsString()
  searchTerm?: string;
  
  @ApiPropertyOptional({ description: 'Include archived content' })
  @IsOptional()
  includeArchived?: boolean;
}

export class RevertToVersionDto {
  @ApiProperty({ description: 'Version ID to revert to' })
  @IsUUID()
  versionId: string;
  
  @ApiPropertyOptional({ description: 'Description of why this version was restored' })
  @IsOptional()
  @IsString()
  restoreReason?: string;
}