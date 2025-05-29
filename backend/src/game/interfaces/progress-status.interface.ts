/**
 * Interfaces related to user progress tracking in the game module
 */

export enum ModuleProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOCKED = 'locked',
  WAITING = 'waiting',
}

export enum SectionProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOCKED = 'locked',
  WAITING = 'waiting',
}

/**
 * Enum defining the possible status values for user progress
 * This is kept for backwards compatibility with existing code
 * Use ModuleProgressStatus for new code
 */
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOCKED = 'locked',
  AWAITING_UNLOCK = 'awaiting_unlock'
}

// Type compatibility between ProgressStatus and ModuleProgressStatus
export type CompatibleProgressStatus = ModuleProgressStatus | ProgressStatus;

/**
 * Interface for progress statistics
 */
export interface ProgressStats {
  completedModules: number;
  totalModules: number;
  completedSections: number;
  totalSections: number;
  correctQuizAnswers?: number;
  totalQuizQuestions?: number;
  averageScore?: number;
  timeSpentMinutes?: number;
}

/**
 * Interface for completion data
 */
export interface CompletionData {
  isCompleted: boolean;
  completionDate?: Date;
  completionPercentage: number;
}

export interface ModuleProgress {
  moduleId: string;
  title: string;
  status: ModuleProgressStatus;
  progressPercentage: number;
  sectionsCompleted: number;
  totalSections: number;
  completionDate?: Date;
  isRewardClaimed: boolean;
  rewardClaimDate?: Date;
  unlockDate?: Date;
  lastAccessedDate?: Date;
  nextSectionId?: string;
  waitTimeRemaining?: TimeRemaining;
  rewardAmount?: string; // Decimal string representation for precision
}

export interface SectionProgress {
  sectionId: string;
  title: string;
  status: SectionProgressStatus;
  orderIndex: number;
  completionDate?: Date;
  timeSpent?: number; // Time spent in seconds
  unlockDate?: Date;
  waitTimeRemaining?: TimeRemaining;
  responses?: Record<string, any>;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface OverallProgress {
  modulesCompleted: number;
  totalModules: number;
  progressPercentage: number;
  totalRewardsEarned: string; // Decimal string representation
  nextModuleUnlock?: {
    moduleId: string;
    title: string;
    unlockDate: Date;
    waitTimeRemaining?: TimeRemaining;
  };
}

export interface QuizResult {
  sectionId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number; // Percentage (0-100)
  pointsEarned: number;
  isPassed: boolean;
  completionDate: Date;
  timeSpent: number; // Time spent in seconds
}

/**
 * Interface for user progress information
 */
export interface UserProgressInfo {
  userId: string;
  moduleId: string;
  status: ProgressStatus;
  percentComplete: number;
  sectionsCompleted: number;
  totalSections: number;
  completionDate?: Date;
  lastAccessDate?: Date;
  currentSectionId?: string;
  nextSectionId?: string;
  rewardClaimed: boolean;
  rewardAmount?: number;
}

/**
 * Interface for module progress statistics
 */
export interface ModuleProgressStats {
  moduleId: string;
  title: string;
  usersStarted: number;
  usersCompleted: number;
  completionRate: number;
  averageTimeToComplete?: number; // in minutes
  rewardsClaimed: number;
  totalRewardsDistributed?: number;
}

/**
 * Interface for section progress statistics
 */
export interface SectionProgressStats {
  sectionId: string;
  title: string;
  usersStarted: number;
  usersCompleted: number;
  completionRate: number;
  averageTimeSpent?: number; // in seconds
  dropOffRate?: number; // percentage of users who abandoned at this section
}