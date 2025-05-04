import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameNotificationTemplate } from '../entities/game-notification-template.entity';
import { UserNotification } from '../entities/user-notification.entity';
import { ModuleNotificationSchedule } from '../entities/module-notification-schedule.entity';
import { GameModule } from '../entities/game-module.entity';
import { NotificationType, TriggerType } from '../interfaces/notification-types.interface';

@Injectable()
export class GameNotificationService {
  private readonly logger = new Logger(GameNotificationService.name);

  constructor(
    @InjectRepository(GameNotificationTemplate)
    private notificationTemplateRepo: Repository<GameNotificationTemplate>,
    
    @InjectRepository(UserNotification)
    private userNotificationRepo: Repository<UserNotification>,
    
    @InjectRepository(ModuleNotificationSchedule)
    private moduleScheduleRepo: Repository<ModuleNotificationSchedule>,
    
    @InjectRepository(GameModule)
    private gameModuleRepo: Repository<GameModule>,
    
    private eventEmitter: EventEmitter2,
  ) {}

  // Create a notification template
  async createTemplate(templateData: Partial<GameNotificationTemplate>): Promise<GameNotificationTemplate> {
    // Check if module exists
    if (templateData.moduleId) {
      const moduleExists = await this.gameModuleRepo.count({
        where: { id: templateData.moduleId as any }
      });
      
      if (!moduleExists) {
        throw new NotFoundException(`Module with ID ${templateData.moduleId} not found`);
      }
    }
    
    const template = this.notificationTemplateRepo.create(templateData);
    return this.notificationTemplateRepo.save(template);
  }

  // Get notification templates for a specific module
  async getNotificationTemplates(moduleId: string): Promise<GameNotificationTemplate[]> {
    return this.notificationTemplateRepo.find({
      where: { moduleId: moduleId as any },
      order: { createdAt: 'ASC' }
    });
  }

  // Get templates
  async getTemplates(filters?: Partial<GameNotificationTemplate>): Promise<GameNotificationTemplate[]> {
    return this.notificationTemplateRepo.find({
      where: filters as any,
      order: { createdAt: 'DESC' }
    });
  }

  // Get a specific notification template by ID
  async getNotificationTemplate(templateId: string): Promise<GameNotificationTemplate> {
    const template = await this.notificationTemplateRepo.findOne({
      where: { id: templateId },
      relations: ['module']
    });
    
    if (!template) {
      throw new NotFoundException(`Notification template with ID ${templateId} not found`);
    }
    
    return template;
  }

  // Find a notification template by type for a specific module
  async findOneByType(moduleId: string, notificationType: NotificationType): Promise<GameNotificationTemplate> {
    return this.notificationTemplateRepo.findOne({
      where: {
        moduleId: moduleId as any,
        notificationType: notificationType as any,
        isActive: true
      }
    });
  }

  // Update a notification template
  async updateTemplate(templateId: string, updateData: Partial<GameNotificationTemplate>): Promise<GameNotificationTemplate> {
    const template = await this.notificationTemplateRepo.findOne({
      where: { id: templateId }
    });
    
    if (!template) {
      throw new NotFoundException(`Notification template with ID ${templateId} not found`);
    }
    
    const updatedTemplate = {
      ...template,
      ...updateData,
      updatedAt: new Date()
    };
    
    return this.notificationTemplateRepo.save(updatedTemplate);
  }

  // Delete a notification template
  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.notificationTemplateRepo.findOne({
      where: { id: templateId }
    });
    
    if (!template) {
      throw new NotFoundException(`Notification template with ID ${templateId} not found`);
    }
    
    await this.notificationTemplateRepo.remove(template);
  }

  // Get notification schedules for a module
  async getNotificationSchedules(moduleId: string): Promise<ModuleNotificationSchedule[]> {
    return this.moduleScheduleRepo.find({
      where: { moduleId: moduleId as any },
      relations: ['template'],
      order: { createdAt: 'ASC' }
    });
  }

  // Create or update a module notification schedule
  async createOrUpdateSchedule(scheduleData: Partial<ModuleNotificationSchedule>): Promise<ModuleNotificationSchedule> {
    if (scheduleData.id) {
      await this.moduleScheduleRepo.update(scheduleData.id, scheduleData);
      return this.moduleScheduleRepo.findOne({ where: { id: scheduleData.id } });
    }
    
    const schedule = this.moduleScheduleRepo.create(scheduleData);
    return this.moduleScheduleRepo.save(schedule);
  }

  // Send notification to user(s)
  async sendNotification(
    templateId: string, 
    userIds: string | string[],
    customData?: Record<string, any>
  ): Promise<UserNotification[]> {
    const template = await this.notificationTemplateRepo.findOne({ 
      where: { id: templateId, isActive: true } 
    });
    
    if (!template) {
      this.logger.warn(`Attempt to send notification with inactive or non-existent template: ${templateId}`);
      return [];
    }
    
    const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
    
    const notifications = await Promise.all(userIdArray.map(async userId => {
      const notification = this.userNotificationRepo.create({
        userId,
        templateId,
        customData,
        moduleId: template.moduleId,
      });
      return notification;
    }));
    
    const savedNotifications = await this.userNotificationRepo.save(notifications);
    
    // Emit events for real-time notifications
    savedNotifications.forEach(notification => {
      this.eventEmitter.emit('notification.created', {
        userId: notification.userId,
        notification: {
          ...notification,
          template
        }
      });
    });
    
    return savedNotifications;
  }

  // Schedule unlock notifications for a module
  async scheduleUnlockNotifications(
    userId: string, 
    moduleId: string, 
    unlockDate: Date,
    waitTimeHours: number
  ): Promise<void> {
    // Check if module exists
    const module = await this.gameModuleRepo.findOne({
      where: { id: moduleId as any }
    });
    
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    
    // Find active notification schedules for this module
    const schedules = await this.moduleScheduleRepo.find({
      where: {
        moduleId: moduleId as any,
        isActive: true
      },
      relations: ['template']
    });
    
    if (schedules.length === 0) {
      this.logger.debug(`No notification schedules found for module ${moduleId}`);
      return;
    }
    
    // Create a notification for each schedule
    const notifications = schedules.map(schedule => {
      let scheduledFor: Date;
      
      if (schedule.triggerType === TriggerType.AFTER_UNLOCK && schedule.triggerHours) {
        // Schedule for X hours after unlock
        scheduledFor = new Date(unlockDate.getTime() + schedule.triggerHours * 60 * 60 * 1000);
      } else if (schedule.triggerType === TriggerType.TIME_AFTER_COMPLETION && waitTimeHours) {
        // Schedule for X hours after expected completion
        scheduledFor = new Date(unlockDate.getTime() + waitTimeHours * 60 * 60 * 1000);
      } else if (schedule.triggerType === TriggerType.SPECIFIC_TIME && schedule.triggerTime) {
        // Schedule for specific time on unlock date
        const [hours, minutes] = schedule.triggerTime.split(':').map(Number);
        scheduledFor = new Date(unlockDate);
        scheduledFor.setHours(hours, minutes, 0, 0);
        
        // If the time has already passed for today, schedule for tomorrow
        if (scheduledFor < new Date()) {
          scheduledFor.setDate(scheduledFor.getDate() + 1);
        }
      } else {
        // Default to immediate notification
        scheduledFor = new Date();
      }
      
      const notification = this.userNotificationRepo.create({
        userId,
        moduleId,
        templateId: schedule.templateId,
        scheduleId: schedule.id,
        scheduledFor,
        customData: {
          module_title: module.title
        }
      });

      return notification;
    });
    
    await this.userNotificationRepo.save(notifications);
    
    this.logger.log(`Scheduled ${notifications.length} notifications for user ${userId} and module ${moduleId}`);
  }

  // Send an immediate unlock notification
  async sendImmediateUnlockNotification(
    userId: string, 
    moduleId: string,
    unlockType: string
  ): Promise<void> {
    const module = await this.gameModuleRepo.findOne({
      where: { id: moduleId as any }
    });
    
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    
    // Find the unlock notification template
    const template = await this.findOneByType(moduleId, NotificationType.MODULE_UNLOCK);
    
    if (!template) {
      this.logger.warn(`No module unlock notification template found for module ${moduleId}`);
      return;
    }
    
    await this.sendNotification(template.id, userId, {
      module_title: module.title,
      unlock_type: unlockType
    });
    
    this.logger.log(`Sent immediate unlock notification to user ${userId} for module ${moduleId}`);
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, options?: { 
    limit?: number;
    offset?: number;
    status?: 'read' | 'unread' | 'all';
    moduleId?: string;
  }): Promise<{ notifications: UserNotification[]; total: number; totalCount: number }> {
    const { limit = 20, offset = 0, status = 'all', moduleId } = options || {};
    
    const queryBuilder = this.userNotificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.template', 'template')
      .where('notification.userId = :userId', { userId });
      
    if (status === 'read') {
      queryBuilder.andWhere('notification.read = :read', { read: true });
    } else if (status === 'unread') {
      queryBuilder.andWhere('notification.read = :read', { read: false });
    }
    
    if (moduleId) {
      queryBuilder.andWhere('notification.moduleId = :moduleId', { moduleId });
    }
    
    const [notifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
      
    const totalCount = total; // For backward compatibility with tests
      
    return { notifications, total, totalCount };
  }

  // Mark notifications as read
  async markAsRead(notificationId: string, userId: string): Promise<UserNotification> {
    const notification = await this.userNotificationRepo.findOne({
      where: {
        id: notificationId,
        userId
      },
      relations: ['module']
    });
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found for user ${userId}`);
    }
    
    // Don't update if already read
    if (notification.read) {
      return notification;
    }
    
    notification.read = true;
    notification.readAt = new Date();
    notification.status = 'read';
    
    const updatedNotification = await this.userNotificationRepo.save(notification);
    
    this.eventEmitter.emit('notification.read', {
      userId,
      notificationId
    });
    
    return updatedNotification;
  }

  // Mark multiple notifications as read
  async markAsReadBulk(notificationIds: string[], userId: string): Promise<void> {
    const readAt = new Date();
    
    await this.userNotificationRepo.update(
      { id: In(notificationIds), userId, read: false } as any,
      { read: true, readAt, status: 'read' }
    );
    
    this.eventEmitter.emit('notification.read', { userId, notificationIds });
  }

  // Get user unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    return this.userNotificationRepo.count({ 
      where: { userId, read: false } as any
    });
  }

  // Delete notifications
  async deleteNotifications(notificationIds: string | string[], userId: string): Promise<void> {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    await this.userNotificationRepo.delete({
      id: In(ids),
      userId
    } as any);
    
    this.eventEmitter.emit('notification.deleted', { userId, notificationIds: ids });
  }
  
  // Process scheduled notifications that are due to be sent
  async processScheduledNotifications(): Promise<number> {
    this.logger.log('Processing scheduled notifications');
    
    const now = new Date();
    // Find all notifications that are scheduled for now or earlier and haven't been sent yet
    const pendingNotifications = await this.userNotificationRepo.find({
      where: {
        scheduledFor: LessThanOrEqual(now),
        sentAt: null
      } as any,
      order: {
        scheduledFor: 'ASC'
      } as any
    });
    
    if (pendingNotifications.length === 0) {
      this.logger.debug('No pending notifications to process');
      return 0;
    }
    
    let sentCount = 0;
    
    // Process notifications in batches to avoid overwhelming the system
    for (const notification of pendingNotifications) {
      try {
        // Mark as sent
        notification.sentAt = new Date();
        await this.userNotificationRepo.save(notification);
        
        // Fetch template to include in the emitted event
        const template = await this.notificationTemplateRepo.findOne({
          where: { id: notification.templateId }
        });
        
        // Emit real-time notification event
        this.eventEmitter.emit('notification.created', {
          userId: notification.userId,
          notification: {
            ...notification,
            template
          }
        });
        
        sentCount++;
      } catch (error) {
        this.logger.error(`Failed to process notification ID ${notification.id}`, error);
      }
    }
    
    this.logger.log(`Successfully processed ${sentCount} scheduled notifications`);
    return sentCount;
  }

  // Get upcoming (scheduled but not sent) notifications for a user
  async getUpcomingNotifications(
    userId: string,
    moduleId?: string
  ): Promise<{ notifications: UserNotification[] }> {
    const queryBuilder = this.userNotificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.template', 'template')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.sentAt IS NULL');
      
    if (moduleId) {
      queryBuilder.andWhere('notification.moduleId = :moduleId', { moduleId });
    }
    
    const notifications = await queryBuilder
      .orderBy('notification.scheduledFor', 'ASC')
      .getMany();
      
    return { notifications };
  }
}
