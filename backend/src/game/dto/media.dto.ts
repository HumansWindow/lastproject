import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsNumber } from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other'
}

export enum MediaCategory {
  SECTION_CONTENT = 'section_content',
  PROFILE = 'profile',
  ACHIEVEMENT = 'achievement',
  BACKGROUND = 'background',
  ICON = 'icon'
}

export class MediaAssetDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSize: number;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty({ enum: MediaCategory })
  category: MediaCategory;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateMediaAssetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  filename: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ enum: MediaCategory })
  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  moduleId?: string;
}

export class UpdateMediaAssetDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ enum: MediaCategory })
  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;
}

export class MediaFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  createdBy?: string;
}

export class PaginatedMediaAssetsDto {
  @ApiProperty({ type: [MediaAssetDto] })
  items: MediaAssetDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class SignedUrlDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  expiresAt: Date;
}

export class MediaAssetListDto {
  @ApiProperty({ type: [MediaAssetDto] })
  assets: MediaAssetDto[];

  @ApiProperty()
  totalCount: number;
  
  @ApiProperty()
  page: number;
  
  @ApiProperty()
  limit: number;
}

export class MediaAssetFilterDto {
  @ApiPropertyOptional({ enum: MediaType })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiPropertyOptional({ enum: MediaCategory })
  @IsEnum(MediaCategory)
  @IsOptional()
  category?: MediaCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  moduleId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class BulkDeleteMediaAssetsDto {
  @ApiProperty({ type: [String] })
  @IsUUID(undefined, { each: true })
  assetIds: string[];
}

export class MediaUploadResponseDto {
  @ApiProperty()
  asset: MediaAssetDto;
  
  @ApiProperty()
  success: boolean;
}