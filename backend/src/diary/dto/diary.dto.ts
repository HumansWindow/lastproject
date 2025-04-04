import { IsString, IsInt, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { DiaryLocation } from '../entities/diary.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDiaryDto {
  @ApiProperty({ description: 'Title of the diary entry' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Game level when this diary entry was created' })
  @IsInt()
  gameLevel: number;

  @ApiProperty({ 
    description: 'Location/context where the diary entry was created', 
    enum: DiaryLocation,
    default: DiaryLocation.OTHER 
  })
  @IsEnum(DiaryLocation)
  location: DiaryLocation;

  @ApiProperty({ description: 'Feeling associated with this diary entry', required: false })
  @IsString()
  @IsOptional()
  feeling?: string;

  @ApiProperty({ description: 'Color chosen for this diary entry', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Content of the diary entry' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Whether this diary entry has media attached' })
  @IsBoolean()
  @IsOptional()
  hasMedia?: boolean;

  @ApiProperty({ description: 'Paths to media files associated with this entry', required: false })
  @IsArray()
  @IsOptional()
  mediaPaths?: string[];

  @ApiProperty({ description: 'Whether this diary entry is stored locally' })
  @IsBoolean()
  @IsOptional()
  isStoredLocally?: boolean;
}

export class UpdateDiaryDto {
  @ApiProperty({ description: 'Title of the diary entry', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Game level when this diary entry was created', required: false })
  @IsInt()
  @IsOptional()
  gameLevel?: number;

  @ApiProperty({ 
    description: 'Location/context where the diary entry was created', 
    enum: DiaryLocation,
    required: false
  })
  @IsEnum(DiaryLocation)
  @IsOptional()
  location?: DiaryLocation;

  @ApiProperty({ description: 'Feeling associated with this diary entry', required: false })
  @IsString()
  @IsOptional()
  feeling?: string;

  @ApiProperty({ description: 'Color chosen for this diary entry', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Content of the diary entry', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Whether this diary entry has media attached', required: false })
  @IsBoolean()
  @IsOptional()
  hasMedia?: boolean;

  @ApiProperty({ description: 'Paths to media files associated with this entry', required: false })
  @IsArray()
  @IsOptional()
  mediaPaths?: string[];

  @ApiProperty({ description: 'Whether this diary entry is stored locally', required: false })
  @IsBoolean()
  @IsOptional()
  isStoredLocally?: boolean;
}

export class DiaryResponseDto {
  id: string;
  title: string;
  gameLevel: number;
  location: DiaryLocation;
  feeling: string;
  color: string;
  content: string;
  hasMedia: boolean;
  mediaPaths: string[];
  isStoredLocally: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}