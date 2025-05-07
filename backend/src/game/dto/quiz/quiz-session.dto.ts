import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsEnum,
  IsArray,
  IsObject,
  IsDate,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizSessionStatus, QuizAttemptResultStatus } from '../../interfaces/quiz/quiz-types.interface';

/**
 * DTO for starting a new quiz session
 */
export class StartQuizSessionDto {
  @ApiProperty({ description: 'ID of the quiz to start' })
  @IsUUID()
  quizId: string;
}

/**
 * DTO for a user's quiz session
 */
export class QuizSessionDto {
  @ApiProperty({ description: 'Quiz session ID' })
  id: string;

  @ApiProperty({ description: 'Quiz ID' })
  quizId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Session status', enum: QuizSessionStatus })
  status: QuizSessionStatus;

  @ApiProperty({ description: 'Start time of the session' })
  startTime: Date;

  @ApiPropertyOptional({ description: 'End time of the session' })
  endTime?: Date;

  @ApiProperty({ description: 'Current score' })
  score: number;

  @ApiProperty({ description: 'Percentage score (0-100)' })
  percentageScore: number;

  @ApiPropertyOptional({ description: 'Result status classification', enum: QuizAttemptResultStatus })
  resultStatus?: QuizAttemptResultStatus;

  @ApiProperty({ description: 'Attempt number for this user' })
  attemptNumber: number;

  @ApiProperty({ description: 'Number of questions answered' })
  questionsAnswered: number;

  @ApiProperty({ description: 'Number of questions answered correctly' })
  questionsCorrect: number;

  @ApiProperty({ description: 'Total time spent in seconds' })
  totalTimeSpent: number;

  @ApiPropertyOptional({ description: 'Order of question IDs as presented to the user' })
  questionOrder?: string[];

  @ApiProperty({ description: 'Whether the quiz was passed' })
  isPassed: boolean;

  @ApiPropertyOptional({ description: 'Overall feedback for this session' })
  feedback?: string;

  @ApiProperty({ description: 'When the session was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the session was last updated' })
  updatedAt: Date;
}

/**
 * DTO for a simplified quiz session response (used in lists)
 */
export class QuizSessionSummaryDto {
  @ApiProperty({ description: 'Quiz session ID' })
  id: string;

  @ApiProperty({ description: 'Quiz ID' })
  quizId: string;

  @ApiProperty({ description: 'Quiz title' })
  quizTitle: string;

  @ApiProperty({ description: 'Session status', enum: QuizSessionStatus })
  status: QuizSessionStatus;

  @ApiProperty({ description: 'Start time of the session' })
  startTime: Date;

  @ApiPropertyOptional({ description: 'End time of the session' })
  endTime?: Date;

  @ApiProperty({ description: 'Percentage score (0-100)' })
  percentageScore: number;

  @ApiProperty({ description: 'Whether the quiz was passed' })
  isPassed: boolean;

  @ApiProperty({ description: 'Attempt number for this user' })
  attemptNumber: number;
}

/**
 * DTO for pagination of quiz sessions
 */
export class PaginatedQuizSessionsDto {
  @ApiProperty({ description: 'List of quiz sessions', type: [QuizSessionSummaryDto] })
  sessions: QuizSessionSummaryDto[];

  @ApiProperty({ description: 'Total number of sessions' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Number of sessions per page' })
  limit: number;
}

/**
 * DTO for a quiz response within SubmitQuizResponsesDto
 */
export class QuizResponseDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'User\'s answer' })
  @IsObject()  // Adding validation for answer object
  answer: any;

  @ApiProperty({ description: 'Time spent on this question in seconds' })
  @IsNumber()
  @Min(0)
  timeSpent: number;

  @ApiProperty({ description: 'Whether the question was skipped' })
  @IsBoolean()
  skipped: boolean;
}

/**
 * DTO for submitting quiz responses
 */
export class SubmitQuizResponsesDto {
  @ApiProperty({ description: 'Quiz session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Array of responses to questions', type: [QuizResponseDto] })
  @IsArray()
  @Type(() => QuizResponseDto)
  responses: QuizResponseDto[];

  @ApiProperty({ description: 'Total time spent on the quiz in seconds' })
  @IsInt()
  @Min(0)
  totalTimeSpent: number;
}

/**
 * DTO for quiz results
 */
export class QuizResultDto {
  @ApiProperty({ description: 'Quiz session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Quiz ID' })
  quizId: string;

  @ApiProperty({ description: 'Quiz title' })
  quizTitle: string;

  @ApiProperty({ description: 'Total score' })
  score: number;

  @ApiProperty({ description: 'Percentage score (0-100)' })
  percentageScore: number;

  @ApiProperty({ description: 'Total questions in the quiz' })
  totalQuestions: number;

  @ApiProperty({ description: 'Number of correct answers' })
  correctAnswers: number;

  @ApiProperty({ description: 'Number of incorrect answers' })
  incorrectAnswers: number;

  @ApiProperty({ description: 'Number of skipped questions' })
  skippedQuestions: number;

  @ApiProperty({ description: 'Total time spent in seconds' })
  totalTimeSpent: number;

  @ApiProperty({ description: 'Whether the quiz was passed' })
  isPassed: boolean;

  @ApiProperty({ description: 'Result status classification', enum: QuizAttemptResultStatus })
  resultStatus: QuizAttemptResultStatus;

  @ApiPropertyOptional({ description: 'Overall feedback for this attempt' })
  feedback?: string;

  @ApiProperty({ description: 'Attempt number for this user' })
  attemptNumber: number;

  @ApiProperty({ description: 'Whether correct answers should be shown to the user' })
  showCorrectAnswers: boolean;

  @ApiPropertyOptional({ description: 'Detailed results for each question (if showCorrectAnswers is true)' })
  questionResults?: {
    questionId: string;
    questionText: string;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    scoreAwarded: number;
    explanation?: string;
    feedback?: string;
  }[];
}