import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { GameNotificationTemplate } from '../entities/game-notification-template.entity';
import { ModuleNotificationSchedule } from '../entities/module-notification-schedule.entity';
import { UserNotification } from '../entities/user-notification.entity';
import { NotificationType, TriggerType } from '../dto/notification.dto';
import { CreateNotificationTemplateDto, UpdateNotificationTemplateDto } from '../dto/notification.dto';

@Injectable()
export class GameNotificationRepository {
  constructor(
    @InjectRepository(GameNotificationTemplate)
    private readonly notificationTemplateRepository: Repository<GameNotificationTemplate>,
    @InjectRepository(ModuleNotificationSchedule)
    private readonly notificationScheduleRepository: Repository<ModuleNotificationSchedule>,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
  ) {}

  // ==================== Notification Templates ====================

  /**
   * Find notification template by ID
   */
  async findTemplateById(id: string): Promise<GameNotificationTemplate | null> {
    return this.notificationTemplateRepository.findOne({
      where: { id },
      relations: ['module'],
    });
  }

  /**
   * Find notification templates by module ID
   */
  async findTemplatesByModuleId(
    moduleId: string,
  ): Promise<GameNotificationTemplate[]> {
    return this.notificationTemplateRepository.find({
      where: { moduleId },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Find notification templates by type
   */
  async findTemplatesByType(
    notificationType: NotificationType,
  ): Promise<GameNotificationTemplate[]> {
    return this.notificationTemplateRepository.find({
      where: {
        notificationType,
        isActive: true,
      },
      relations: ['module'],
    });
  }

  /**
   * Find one notification template by module ID and type
   */
  async findOneByType(
    moduleId: string,
    notificationType: NotificationType,
  ): Promise<GameNotificationTemplate | null> {
    return this.notificationTemplateRepository.findOne({
      where: {
        moduleId,
        notificationType,
        isActive: true,
      },
    });
  }

  /**
   * Create notification template
   */
  async createTemplate(
    createDto: CreateNotificationTemplateDto,
  ): Promise<GameNotificationTemplate> {
    const template = this.notificationTemplateRepository.create({
      ...createDto,
      isActive: createDto.isActive ?? true,
    });
    return this.notificationTemplateRepository.save(template);
  }

  /**
   * Update notification template
   */
  async updateTemplate(
    id: string,
    updateDto: UpdateNotificationTemplateDto,
  ): Promise<GameNotificationTemplate> {
    await this.notificationTemplateRepository.update(id, updateDto);
    return this.findTemplateById(id);
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.notificationTemplateRepository.delete(id);
  }

  // ==================== Notification Schedules ====================

  /**
   * Find notification schedule by ID
   */
  async findScheduleById(id: string): Promise<ModuleNotificationSchedule | null> {
    return this.notificationScheduleRepository.findOne({
      where: { id },
      relations: ['template', 'module'],
    });
  }

  /**
   * Find notification schedules by module ID
   */
  async findSchedulesByModuleId(
    moduleId: string,
  ): Promise<ModuleNotificationSchedule[]> {
    return this.notificationScheduleRepository.find({
      where: { moduleId, isActive: true },
      relations: ['template'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Find notification schedules by template ID
   */
  async findSchedulesByTemplateId(
    templateId: string,
  ): Promise<ModuleNotificationSchedule[]> {
    return this.notificationScheduleRepository.find({
      where: { templateId, isActive: true },
      relations: ['module', 'template'],
    });
  }

  /**
   * Create notification schedule
   */
  async createSchedule(
    data: Partial<ModuleNotificationSchedule>,
  ): Promise<ModuleNotificationSchedule> {
    const schedule = this.notificationScheduleRepository.create({
      ...data,
      isActive: data.isActive ?? true,
    });
    return this.notificationScheduleRepository.save(schedule);
  }

  /**
   * Update notification schedule
   */
  async updateSchedule(
    id: string,
    data: Partial<ModuleNotificationSchedule>,
  ): Promise<ModuleNotificationSchedule> {
    await this.notificationScheduleRepository.update(id, data);
    return this.findScheduleById(id);
  }

  /**
   * Delete notification schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    await this.notificationScheduleRepository.delete(id);
  }

  /**
   * Find schedules by trigger type
   */
  async findSchedulesByTriggerType(
    triggerType: TriggerType,
  ): Promise<ModuleNotificationSchedule[]> {
    return this.notificationScheduleRepository.find({
      where: {
        triggerType: triggerType as any, // Fix type mismatch with TypeORM's FindOperator
        isActive: true,
      },
      relations: ['module', 'template'],
    });
  }

  // ==================== User Notifications ====================

  /**
   * Find user notification by ID
   */
  async findUserNotificationById(id: string): Promise<UserNotification | null> {
    return this.userNotificationRepository.findOne({
      where: { id } as any,
    });
  }

  /**
   * Find user notifications by user ID
   */
  async findUserNotifications(
    userId: string,
    options?: {
      moduleId?: string;
      isRead?: boolean;
      skip?: number;
      take?: number;
    },
  ): Promise<[UserNotification[], number]> {
    const where: any = { userId };

    if (options?.moduleId) {
      where.moduleId = options.moduleId;
    }

    if (options?.isRead !== undefined) {
      where.read = options.isRead;
    }

    return this.userNotificationRepository.findAndCount({
      where,
      skip: options?.skip,
      take: options?.take,
      order: {
        scheduledFor: 'DESC',
      } as any,
    });
  }

  /**
   * Find upcoming notifications for a user and module
   */
  async findUpcoming(
    userId: string,
    moduleId: string,
  ): Promise<UserNotification[]> {
    const now = new Date();
    return this.userNotificationRepository.find({
      where: {
        userId,
        moduleId,
        sentAt: null,
        scheduledFor: MoreThanOrEqual(now),
      } as any,
      order: {
        scheduledFor: 'ASC',
      } as any,
    });
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: string): Promise<number> {
    return this.userNotificationRepository.count({
      where: {
        userId,
        read: false,
      } as any,
    });
  }

  /**
   * Create user notification
   */
  async create(data: Partial<UserNotification>): Promise<UserNotification> {
    const notification = this.userNotificationRepository.create(data);
    return this.userNotificationRepository.save(notification);
  }

  /**
   * Create multiple user notifications
   */
  async createMany(
    notifications: Partial<UserNotification>[],
  ): Promise<UserNotification[]> {
    const entities = this.userNotificationRepository.create(notifications);
    return this.userNotificationRepository.save(entities);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    await this.userNotificationRepository.update(
      { id, userId } as any,
      {
        read: true,
        readAt: new Date(),
      },
    );
  }

  /**
   * Mark notification as sent
   */
  async markAsSent(id: string): Promise<void> {
    await this.userNotificationRepository.update(id, {
      sentAt: new Date(),
    } as any);
  }

  /**
   * Find notifications ready to send
   */
  async findReadyToSend(): Promise<UserNotification[]> {
    const now = new Date();
    return this.userNotificationRepository.find({
      where: {
        scheduledFor: LessThanOrEqual(now),
        sentAt: null,
      } as any,
      relations: ['module'],
      take: 100, // Process in batches
    });
  }

  /**
   * Delete notification
   */
  async delete(id: string): Promise<void> {
    await this.userNotificationRepository.delete(id);
  }

  /**
   * Delete user notifications
   */
  async deleteUserData(userId: string): Promise<void> {
    await this.userNotificationRepository.delete({ userId });
  }
}