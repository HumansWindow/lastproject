/**
 * Interfaces related to module and section unlocking functionality
 */

/**
 * Enum defining possible unlock status values
 */
export enum UnlockStatus {
  UNLOCKED = 'unlocked',       // Module/section is available
  LOCKED = 'locked',           // Module/section is locked due to prerequisites
  WAITING = 'waiting',         // Module/section is in waiting period
  EXPEDITED = 'expedited',     // Waiting period was skipped through payment
  AWAITING_UNLOCK = 'awaiting_unlock',
  PENDING_REQUIREMENT = 'pending_requirement'
}

export enum UnlockReason {
  PREREQUISITE_NOT_COMPLETED = 'prerequisite_not_completed',
  WAITING_PERIOD = 'waiting_period',
  SECTION_WAITING_PERIOD = 'section_waiting_period',
  PREVIOUS_SECTION_NOT_COMPLETED = 'previous_section_not_completed',
  ADMIN_LOCKED = 'admin_locked'
}

/**
 * Interface for time remaining until unlock
 */
export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface UnlockCondition {
  status: UnlockStatus;
  reason?: UnlockReason;
  prerequisiteModuleId?: string;
  prerequisiteModuleTitle?: string;
  previousSectionId?: string;
  previousSectionTitle?: string;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
}

/**
 * Interface for module unlock information
 */
export interface ModuleUnlockInfo {
  status: UnlockStatus;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
  prerequisiteModuleId?: string;
  prerequisiteModuleTitle?: string;
  waitTimeHours?: number;
  canExpediteThroughPayment?: boolean;
  expediteCost?: string;
}

export interface SectionUnlockInfo {
  status: UnlockStatus;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
  prerequisiteSectionId?: string;
  prerequisiteSectionTitle?: string;
  waitTimeHours?: number;
  canExpediteThroughPayment?: boolean;
  expediteCost?: string;
}

export interface ModuleUnlockResponse {
  hasNextModule: boolean;
  nextModuleId?: string;
  nextModuleTitle?: string;
  unlockDate?: Date;
  waitTimeHours?: number;
  timeRemaining?: TimeRemaining;
}

export interface SectionUnlockResponse {
  hasNextSection: boolean;
  nextSectionId?: string;
  nextSectionTitle?: string;
  unlockDate?: Date;
  waitTimeHours?: number;
  timeRemaining?: TimeRemaining;
}

export interface ModuleAccessResult {
  canAccess: boolean;
  reason?: UnlockReason;
  prerequisiteModuleId?: string;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
}

export interface SectionAccessResult {
  canAccess: boolean;
  reason?: UnlockReason;
  previousSectionId?: string;
  previousSectionTitle?: string;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
  details?: ModuleAccessResult; // For first section in module
}

export interface ExpediteResult {
  success: boolean;
  error?: string;
  message?: string;
  moduleId?: string;
  sectionId?: string;
  isNowUnlocked?: boolean;
  transactionHash?: string;
  amountPaid?: string; // Decimal string representation
}

/**
 * Interface for unlock status results
 */
export interface UnlockStatusResult {
  canAccess: boolean;
  reason?: UnlockReason;
  unlockDate?: Date;
  timeRemaining?: TimeRemaining;
  prerequisiteModuleId?: string;
  prerequisiteModuleTitle?: string;
  previousSectionId?: string;
  previousSectionTitle?: string;
}

/**
 * Interface for unlock schedule item
 */
export interface UnlockScheduleItem {
  id: string;
  userId: string;
  unlockEntityId: string; // Module or section ID
  unlockEntityTitle: string;
  unlockDate: Date;
  isUnlocked: boolean;
  timeRemaining?: TimeRemaining;
  entityType: 'module' | 'section';
}