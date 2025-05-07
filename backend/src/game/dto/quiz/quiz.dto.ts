import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsInt, 
  Min, 
  Max, 
  IsBoolean, 
  IsEnum,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizDifficultyEnum } from '../../interfaces/quiz/quiz-types.interface';

/**
 * DTO for creating a new quiz
 */
export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Quiz description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ID of the module this quiz belongs to' })
  @IsUUID()
  @IsOptional()
  moduleId?: string;

  @ApiPropertyOptional({ description: 'ID of the section this quiz belongs to' })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'Passing score (points needed to pass the quiz)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({ description: 'Time limit in seconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ description: 'Quiz difficulty level' })
  @IsEnum(QuizDifficultyEnum)
  @IsOptional()
  difficulty?: QuizDifficultyEnum;

  @ApiPropertyOptional({ description: 'Score thresholds for different result classifications' })
  @IsObject()
  @IsOptional()
  resultThresholds?: {
    excellent: number;
    good: number;
    pass: number;
  };

  @ApiPropertyOptional({ description: 'Show correct answers after completion' })
  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({ description: 'Randomize question order' })
  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of attempts allowed' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;
}

/**
 * DTO for updating an existing quiz
 */
export class UpdateQuizDto {
  @ApiPropertyOptional({ description: 'Quiz title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Quiz description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Passing score (points needed to pass the quiz)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({ description: 'Time limit in seconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ description: 'Quiz difficulty level' })
  @IsEnum(QuizDifficultyEnum)
  @IsOptional()
  difficulty?: QuizDifficultyEnum;

  @ApiPropertyOptional({ description: 'Score thresholds for different result classifications' })
  @IsObject()
  @IsOptional()
  resultThresholds?: {
    excellent: number;
    good: number;
    pass: number;
  };

  @ApiPropertyOptional({ description: 'Show correct answers after completion' })
  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({ description: 'Randomize question order' })
  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({ description: 'Is the quiz active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of attempts allowed' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;
}

/**
 * DTO for quiz response
 */
export class QuizDto {
  @ApiProperty({ description: 'Quiz ID' })
  id: string;

  @ApiProperty({ description: 'Quiz title' })
  title: string;

  @ApiProperty({ description: 'Quiz description' })
  description: string;

  @ApiPropertyOptional({ description: 'Module ID' })
  moduleId?: string;

  @ApiPropertyOptional({ description: 'Section ID' })
  sectionId?: string;

  @ApiProperty({ description: 'Passing score (points needed to pass the quiz)' })
  passingScore: number;

  @ApiProperty({ description: 'Total points possible in the quiz' })
  totalPoints: number;

  @ApiProperty({ description: 'Time limit in seconds' })
  timeLimit: number;

  @ApiProperty({ description: 'Quiz difficulty level' })
  difficulty: QuizDifficultyEnum;

  @ApiProperty({ description: 'Score thresholds for different result classifications' })
  resultThresholds: {
    excellent: number;
    good: number;
    pass: number;
  };

  @ApiProperty({ description: 'Whether to show correct answers after completion' })
  showCorrectAnswers: boolean;

  @ApiProperty({ description: 'Whether questions are presented in random order' })
  randomizeQuestions: boolean;

  @ApiProperty({ description: 'Is the quiz active' })
  isActive: boolean;

  @ApiProperty({ description: 'Maximum number of attempts allowed' })
  maxAttempts: number;

  @ApiProperty({ description: 'When the quiz was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the quiz was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Who created the quiz' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Number of questions in the quiz' })
  questionCount?: number;
}

/**
 * DTO for paginated quiz responses
 */
export class PaginatedQuizzesDto {
  @ApiProperty({ description: 'List of quizzes', type: [QuizDto] })
  quizzes: QuizDto[];

  @ApiProperty({ description: 'Total number of quizzes' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Number of quizzes per page' })
  limit: number;
}

/**
 * DTO for quiz results statistics
 */
export class QuizStatisticsDto {
  @ApiProperty({ description: 'Quiz ID' })
  quizId: string;

  @ApiProperty({ description: 'Quiz title' })
  title: string;

  @ApiProperty({ description: 'Total number of attempts' })
  totalAttempts: number;

  @ApiProperty({ description: 'Average score (percentage)' })
  averageScore: number;

  @ApiProperty({ description: 'Number of users who passed' })
  passCount: number;

  @ApiProperty({ description: 'Pass rate (percentage)' })
  passRate: number;

  @ApiProperty({ description: 'Average time spent (seconds)' })
  averageTimeSpent: number;

  @ApiProperty({ description: 'Statistics by question' })
  questionStats: {
    questionId: string;
    text: string;
    correctRate: number;
    averageTimeSpent: number;
  }[];
}