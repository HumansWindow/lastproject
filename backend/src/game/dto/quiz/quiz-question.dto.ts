import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsInt, 
  Min, 
  IsBoolean, 
  IsEnum,
  ValidateNested,
  IsArray,
  IsObject,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionTypeEnum } from '../../interfaces/quiz/quiz-types.interface';

/**
 * DTO for creating a new quiz question
 */
export class CreateQuestionDto {
  @ApiProperty({ description: 'ID of the quiz this question belongs to' })
  @IsUUID()
  quizId: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Question type', enum: QuestionTypeEnum })
  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @ApiPropertyOptional({ description: 'Points awarded for this question' })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'Array of options for this question' })
  @IsArray()
  @IsOptional()
  options?: any[];

  @ApiPropertyOptional({ description: 'Correct answer for this question (format depends on question type)' })
  @IsOptional()
  correctAnswer?: any;

  @ApiPropertyOptional({ description: 'Explanation of the answer' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ description: 'URL to an image for this question' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Display order of this question' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Feedback for different answer situations' })
  @IsObject()
  @IsOptional()
  feedback?: {
    correctFeedback?: string;
    incorrectFeedback?: string;
    partialFeedback?: string;
  };

  @ApiPropertyOptional({ description: 'Time limit specific to this question (overrides quiz default)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ description: 'Additional metadata for this question' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for updating an existing question
 */
export class UpdateQuestionDto {
  @ApiPropertyOptional({ description: 'Question text' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'Question type', enum: QuestionTypeEnum })
  @IsEnum(QuestionTypeEnum)
  @IsOptional()
  type?: QuestionTypeEnum;

  @ApiPropertyOptional({ description: 'Points awarded for this question' })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'Array of options for this question' })
  @IsArray()
  @IsOptional()
  options?: any[];

  @ApiPropertyOptional({ description: 'Correct answer for this question (format depends on question type)' })
  @IsOptional()
  correctAnswer?: any;

  @ApiPropertyOptional({ description: 'Explanation of the answer' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ description: 'URL to an image for this question' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Display order of this question' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Feedback for different answer situations' })
  @IsObject()
  @IsOptional()
  feedback?: {
    correctFeedback?: string;
    incorrectFeedback?: string;
    partialFeedback?: string;
  };

  @ApiPropertyOptional({ description: 'Time limit specific to this question (overrides quiz default)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ description: 'Is this question active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata for this question' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for question response
 */
export class QuestionDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'ID of the quiz this question belongs to' })
  quizId: string;

  @ApiProperty({ description: 'Question text' })
  text: string;

  @ApiProperty({ description: 'Question type', enum: QuestionTypeEnum })
  type: QuestionTypeEnum;

  @ApiProperty({ description: 'Points awarded for this question' })
  points: number;

  @ApiProperty({ description: 'Array of options for this question' })
  options: any[];

  @ApiPropertyOptional({ description: 'Correct answer for this question' })
  correctAnswer?: any;

  @ApiPropertyOptional({ description: 'Explanation of the answer' })
  explanation?: string;

  @ApiPropertyOptional({ description: 'URL to an image for this question' })
  imageUrl?: string;

  @ApiProperty({ description: 'Display order of this question' })
  orderIndex: number;

  @ApiPropertyOptional({ description: 'Feedback for different answer situations' })
  feedback?: {
    correctFeedback?: string;
    incorrectFeedback?: string;
    partialFeedback?: string;
  };

  @ApiPropertyOptional({ description: 'Time limit specific to this question (overrides quiz default)' })
  timeLimit?: number;

  @ApiProperty({ description: 'Is this question active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata for this question' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'When the question was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the question was last updated' })
  updatedAt: Date;
}

/**
 * DTO for listing questions with pagination
 */
export class PaginatedQuestionsDto {
  @ApiProperty({ description: 'List of questions', type: [QuestionDto] })
  questions: QuestionDto[];

  @ApiProperty({ description: 'Total number of questions' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Number of questions per page' })
  limit: number;
}