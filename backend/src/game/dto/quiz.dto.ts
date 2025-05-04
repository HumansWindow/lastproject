import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  TEXT_INPUT = 'text_input'
}

export class CreateQuizQuestionDto {
  @ApiProperty({ description: 'Section ID this question belongs to' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  questionText: string;

  @ApiProperty({ description: 'Type of question', enum: QuestionType })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiPropertyOptional({ description: 'Question options (for multiple choice questions)' })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiProperty({ description: 'Correct answer' })
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional({ description: 'Explanation of the correct answer' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ description: 'Points awarded for correct answer', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiProperty({ description: 'Order index for this question in the quiz' })
  @IsNumber()
  @Min(0)
  orderIndex: number;
}

export class UpdateQuizQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class QuizQuestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  questionText: string;

  @ApiProperty({ enum: QuestionType })
  questionType: QuestionType;

  @ApiPropertyOptional()
  options?: string[];

  @ApiProperty()
  points: number;

  @ApiProperty()
  orderIndex: number;

  @ApiPropertyOptional()
  explanation?: string;
}

export class QuizQuestionWithAnswerDto extends QuizQuestionDto {
  @ApiProperty()
  correctAnswer: string;
}

export class QuizQuestionListDto {
  @ApiProperty()
  sectionId: string;
  
  @ApiProperty({ type: [QuizQuestionDto] })
  questions: QuizQuestionDto[];

  @ApiProperty()
  totalCount: number;
}

export class SubmitQuizAnswerDto {
  @ApiProperty()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsString()
  userAnswer: string;
}

export class QuizAnswerResultDto {
  @ApiProperty()
  questionId: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  correctAnswer: string;

  @ApiProperty()
  pointsAwarded: number;

  @ApiPropertyOptional()
  explanation?: string;
}

export class SectionQuizResultDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  correctAnswers: number;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  earnedPoints: number;

  @ApiProperty()
  percentageScore: number;

  @ApiProperty({ type: [QuizAnswerResultDto] })
  answerResults: QuizAnswerResultDto[];
}

export class UserQuizResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  questionId: string;

  @ApiProperty()
  userAnswer: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  pointsAwarded: number;

  @ApiProperty()
  createdAt: Date;
}

export class QuizResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  questionId: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  points: number;

  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  totalQuestions: number;
  @ApiProperty()
  answeredQuestions: number;
  @ApiProperty()
  correctAnswers: number;
  @ApiProperty()
  totalPoints: number;
  @ApiProperty()
  earnedPoints: number;
  @ApiProperty()
  percentageScore: number;
}

export class SectionQuizDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  title: string;
  
  @ApiProperty()
  sectionTitle: string;
  
  @ApiProperty()
  totalQuestions: number;
  
  @ApiProperty()
  totalPoints: number;

  @ApiProperty({ type: [QuizQuestionDto] })
  questions: QuizQuestionDto[];
}

export class QuizSummaryDto {
  @ApiProperty()
  sectionId: string;
  
  @ApiProperty()
  totalQuestions: number;
  
  @ApiProperty()
  totalPoints: number;
  
  @ApiProperty()
  passThreshold: number;
}