/**
 * Interfaces related to game notifications system
 */

/**
 * Enum defining the types of game notifications
 */
export enum NotificationType {
  REMINDER = 'reminder',               // Reminding users to continue their progress
  ACHIEVEMENT = 'achievement',         // For completed modules
  MODULE_UNLOCK = 'module_unlock',     // When a module becomes available
  EXPEDITED_UNLOCK = 'expedited_unlock', // When a module is unlocked through payment
  CUSTOM = 'custom',                    // Custom notifications
  MODULE_UNLOCKED = 'module_unlocked',
  SECTION_UNLOCKED = 'section_unlocked',
  MODULE_COMPLETED = 'module_completed',
  SECTION_COMPLETED = 'section_completed',
  REWARD_EARNED = 'reward_earned',
  ANNOUNCEMENT = 'announcement'
}

/**
 * Enum defining the trigger types for notifications
 */
export enum TriggerType {
  TIME_AFTER_COMPLETION = 'time_after_completion',  // Hours after previous module completion
  SPECIFIC_TIME = 'specific_time',        // At a specific time of day
  BEFORE_UNLOCK = 'before_unlock',         // Hours before a module unlocks
  AFTER_UNLOCK = 'after_unlock',
  UPON_COMPLETION = 'upon_completion'
}

/**
 * Enum for notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms'
}

/**
 * Enum for notification priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

/**
 * Interface for notification template
 */
export interface NotificationTemplateInfo {
  id: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  moduleId: string;
}

export interface NotificationTemplate {
  id: string;
  moduleId: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for notification configuration
 */
export interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message?: string;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  action?: {
    type: 'redirect' | 'button' | 'dismiss';
    label?: string;
    url?: string;
    data?: Record<string, any>;
  };
  icon?: string;
  imageUrl?: string;
  expiresIn?: number; // In hours
}

/**
 * Interface for notification template data
 */
export interface NotificationTemplateData {
  userId?: string;
  userName?: string;
  moduleId?: string;
  moduleTitle?: string;
  sectionId?: string;
  sectionTitle?: string;
  rewardAmount?: number;
  achievementName?: string;
  announcementId?: string;
  gameStatus?: string;
  [key: string]: any; // Allow for additional template data
}

/**
 * Interface for notification schedule
 */
export interface NotificationScheduleInfo {
  id: string;
  moduleId: string;
  templateId: string;
  triggerType: TriggerType;
  triggerHours?: number;
  triggerTime?: string; // Time in format HH:MM:SS
  isActive: boolean;
}

export interface NotificationSchedule {
  id: string;
  moduleId: string;
  templateId: string;
  triggerType: TriggerType;
  triggerHours?: number;
  triggerTime?: string; // Format: "HH:MM:SS"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  template?: NotificationTemplate;
}

/**
 * Interface for user notification
 */
export interface UserNotificationInfo {
  id: string;
  userId: string;
  moduleId: string;
  templateId: string;
  scheduleId?: string;
  title: string;
  body: string;
  scheduledFor: Date;
  sentAt?: Date;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface UpcomingNotification {
  id: string;
  title: string;
  scheduledFor: Date;
}

export interface UpcomingNotificationList {
  moduleId: string;
  notifications: UpcomingNotification[];
}

export interface NotificationScheduleConfig {
  moduleId: string;
  unlockDate: Date;
  waitTimeHours: number;
  userId: string;
}

export interface NotificationBatchResult {
  scheduled: number;
  failed: number;
  errors?: string[];
}