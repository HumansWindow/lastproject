import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export enum NotificationType {
  REMINDER = 'reminder',
  ACHIEVEMENT = 'achievement',
  MODULE_UNLOCK = 'module_unlock',
  EXPEDITED_UNLOCK = 'expedited_unlock',
  CUSTOM = 'custom',
  MODULE_UNLOCKED = 'module_unlocked',
  SECTION_UNLOCKED = 'section_unlocked',
  MODULE_COMPLETED = 'module_completed',
  SECTION_COMPLETED = 'section_completed',
  REWARD_EARNED = 'reward_earned',
  ANNOUNCEMENT = 'announcement'
}

export enum TriggerType {
  TIME_AFTER_COMPLETION = 'time_after_completion',
  SPECIFIC_TIME = 'specific_time',
  BEFORE_UNLOCK = 'before_unlock',
  IMMEDIATE = 'immediate',
  AFTER_UNLOCK = 'after_unlock',
  UPON_COMPLETION = 'upon_completion'
}

export class CreateNotificationTemplateDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  notificationType?: NotificationType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class NotificationTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: NotificationType })
  notificationType: NotificationType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateNotificationScheduleDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ enum: TriggerType })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  triggerHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  triggerTime?: string; // Format: 'HH:MM'

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateNotificationScheduleDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({ enum: TriggerType })
  @IsEnum(TriggerType)
  @IsOptional()
  triggerType?: TriggerType;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  triggerHours?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  triggerTime?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class NotificationScheduleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  templateId: string;
  
  @ApiPropertyOptional()
  templateTitle?: string;

  @ApiProperty({ enum: TriggerType })
  triggerType: TriggerType;

  @ApiPropertyOptional()
  triggerHours?: number;

  @ApiPropertyOptional()
  triggerTime?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserNotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  moduleId: string;

  @ApiPropertyOptional()
  templateId?: string;

  @ApiPropertyOptional()
  scheduleId?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  scheduledFor: Date;

  @ApiPropertyOptional()
  sentAt?: Date;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserNotificationListDto {
  @ApiProperty({ type: [UserNotificationDto] })
  notifications: UserNotificationDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  unreadCount: number;
}

export class MarkNotificationReadDto {
  @ApiProperty()
  @IsUUID()
  notificationId: string;
}

export class NotificationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  notificationId?: string;
}

export class UpcomingNotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  scheduledFor: Date;
}

export class UpcomingNotificationListDto {
  @ApiProperty()
  moduleId: string;

  @ApiProperty({ type: [UpcomingNotificationDto] })
  notifications: UpcomingNotificationDto[];
}

export class NotificationSendBatchResultDto {
  @ApiProperty()
  sentCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [String] })
  errors: string[];
}

// Aliases for compatibility with existing code
export class GameNotificationTemplateDto extends NotificationTemplateDto {}
export class ModuleNotificationScheduleDto extends NotificationScheduleDto {}