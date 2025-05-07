/**
 * Quiz Types Interface
 * Defines enums and types used throughout the quiz system
 */

/**
 * Quiz question types enumeration
 */
export enum QuestionTypeEnum {
  MULTIPLE_CHOICE = 'multiple_choice',
  SINGLE_CHOICE = 'single_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  MATCH_PAIRS = 'match_pairs',
  FILL_IN_BLANKS = 'fill_in_blanks',
  SEQUENCE = 'sequence',
  INTERACTIVE = 'interactive'
}

/**
 * Quiz difficulty levels enumeration
 */
export enum QuizDifficultyEnum {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Question option type for choices
 */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
  imageUrl?: string;
  orderIndex?: number;
}

/**
 * Match pair item structure
 */
export interface MatchPair {
  id: string;
  leftItem: string;
  rightItem: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

/**
 * Fill in blanks text parts
 */
export interface BlankTextPart {
  id: string;
  text: string;
  isBlank: boolean;
  correctAnswer?: string;
  acceptableAnswers?: string[];
}

/**
 * Sequence item structure
 */
export interface SequenceItem {
  id: string;
  text: string;
  imageUrl?: string;
  orderIndex: number;
}

/**
 * Interactive element configuration
 */
export interface InteractiveElementConfig {
  elementType: string;
  config: Record<string, any>;
  correctState: Record<string, any>;
}

/**
 * Question feedback configuration
 */
export interface QuestionFeedback {
  correctFeedback?: string;
  incorrectFeedback?: string;
  partialFeedback?: string;
}

/**
 * Quiz result thresholds
 */
export interface QuizResultThresholds {
  excellent: number; // Minimum percentage for excellent result
  good: number;      // Minimum percentage for good result
  pass: number;      // Minimum percentage to pass
}

/**
 * Quiz session status
 */
export enum QuizSessionStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired'
}

/**
 * Quiz attempt result status
 */
export enum QuizAttemptResultStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  PASS = 'pass',
  FAIL = 'fail'
}