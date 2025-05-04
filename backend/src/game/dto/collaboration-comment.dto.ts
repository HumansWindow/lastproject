import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsString, IsBoolean, IsObject, IsDateString } from 'class-validator';

export class CollaborationCommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contentId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  comment: string;

  @ApiProperty({ enum: ['feedback', 'question', 'suggestion', 'resolution'] })
  commentType: 'feedback' | 'question' | 'suggestion' | 'resolution';

  @ApiProperty({ required: false })
  parentCommentId?: string;

  @ApiProperty()
  isResolved: boolean;

  @ApiProperty({ required: false })
  resolvedBy?: string;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

  @ApiProperty({ required: false })
  contextData?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateCollaborationCommentDto {
  @ApiProperty()
  @IsUUID()
  contentId: string;

  @ApiProperty()
  @IsString()
  comment: string;

  @ApiProperty({ enum: ['feedback', 'question', 'suggestion', 'resolution'], default: 'feedback' })
  @IsEnum(['feedback', 'question', 'suggestion', 'resolution'])
  @IsOptional()
  commentType?: 'feedback' | 'question' | 'suggestion' | 'resolution';

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parentCommentId?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  contextData?: Record<string, any>;
}

export class UpdateCollaborationCommentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ required: false, enum: ['feedback', 'question', 'suggestion', 'resolution'] })
  @IsEnum(['feedback', 'question', 'suggestion', 'resolution'])
  @IsOptional()
  commentType?: 'feedback' | 'question' | 'suggestion' | 'resolution';

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isResolved?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  contextData?: Record<string, any>;
}

export class CommentQueryDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  contentId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, enum: ['feedback', 'question', 'suggestion', 'resolution'] })
  @IsEnum(['feedback', 'question', 'suggestion', 'resolution'])
  @IsOptional()
  commentType?: 'feedback' | 'question' | 'suggestion' | 'resolution';

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  unresolved?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  includeReplies?: boolean = true;
}