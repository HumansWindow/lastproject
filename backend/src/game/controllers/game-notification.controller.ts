import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
  ValidationPipe,
  Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { GameNotificationService } from '../services/game-notification.service';
import { RequestWithUser } from '../../shared/interfaces/request-with-user.interface';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody 
} from '@nestjs/swagger';
import {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateDto,
  CreateNotificationScheduleDto,
  UpdateNotificationScheduleDto,
  NotificationScheduleDto,
  UserNotificationDto,
  UserNotificationListDto,
  MarkNotificationReadDto,
  NotificationResultDto,
  UpcomingNotificationListDto,
  NotificationType,
  TriggerType
} from '../dto/notification.dto';

@ApiTags('Game Notifications')
@ApiBearerAuth()
@Controller('game/notifications')
export class GameNotificationController {
  constructor(private readonly notificationService: GameNotificationService) {}

  // User notification endpoints
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'onlyUnread', required: false, type: Boolean })
  async getNotifications(
    @GetUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('onlyUnread') onlyUnread: boolean = false
  ): Promise<UserNotificationListDto> {
    const result = await this.notificationService.getUserNotifications(user.id, {
      limit,
      offset: (page - 1) * limit,
      status: onlyUnread ? 'unread' : 'all'
    });

    // Map entity to DTO
    const notifications: UserNotificationDto[] = result.notifications.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      moduleId: notification.customData?.moduleId || '',
      templateId: notification.templateId,
      scheduleId: notification.customData?.scheduleId,
      title: notification.template?.title || '',
      body: notification.template?.message || '',
      scheduledFor: notification.createdAt,
      sentAt: notification.createdAt,
      isRead: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    }));

    return {
      notifications,
      totalCount: result.total,
      unreadCount: notifications.filter(n => !n.isRead).length
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns count of unread notifications' })
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationService.getUnreadCount(user.id);
    
    return {
      unreadCount: count
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Notification not found' })
  async markAsRead(
    @GetUser() user: User,
    @Param('notificationId') notificationId: string
  ): Promise<NotificationResultDto> {
    try {
      await this.notificationService.markAsRead(notificationId, user.id);
      
      return {
        success: true,
        message: 'Notification marked as read',
        notificationId
      };
    } catch (error) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllAsRead(@GetUser() user: User): Promise<NotificationResultDto> {
    // Get all unread notifications for the user
    const result = await this.notificationService.getUserNotifications(user.id, {
      status: 'unread'
    });
    
    if (result.notifications.length > 0) {
      const notificationIds = result.notifications.map(n => n.id);
      await this.notificationService.markAsReadBulk(notificationIds, user.id);
    }
    
    return {
      success: true,
      message: `Marked ${result.notifications.length} notifications as read`
    };
  }

  // Admin template management endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates (admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of notification templates' })
  async getAllTemplates(): Promise<{ templates: NotificationTemplateDto[], totalCount: number }> {
    const templates = await this.notificationService.getTemplates();
    
    // Map entity to DTO
    const templateDtos: NotificationTemplateDto[] = templates.map(template => ({
      id: template.id,
      moduleId: template.gameFeature || '',
      title: template.title,
      body: template.message,
      notificationType: this.mapTypeToNotificationType(template.type),
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }));
    
    return { 
      templates: templateDtos,
      totalCount: templateDtos.length
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a notification template by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The notification template' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async getTemplateById(@Param('id') id: string): Promise<NotificationTemplateDto> {
    const templates = await this.notificationService.getTemplates({ id });
    
    if (!templates || templates.length === 0) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    const template = templates[0];
    
    // Map entity to DTO
    return {
      id: template.id,
      moduleId: template.gameFeature || '',
      title: template.title,
      body: template.message,
      notificationType: this.mapTypeToNotificationType(template.type),
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('templates')
  @ApiOperation({ summary: 'Create a new notification template (admin)' })
  @ApiBody({ type: CreateNotificationTemplateDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The notification template has been successfully created' })
  async createTemplate(@Body() createDto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    // Convert DTO to entity format
    const templateData = {
      title: createDto.title,
      message: createDto.body,
      gameFeature: createDto.moduleId,
      type: this.mapNotificationTypeToType(createDto.notificationType),
      isActive: createDto.isActive ?? true
    };
    
    const createdTemplate = await this.notificationService.createTemplate(templateData);
    
    // Map entity back to DTO
    return {
      id: createdTemplate.id,
      moduleId: createdTemplate.gameFeature || '',
      title: createdTemplate.title,
      body: createdTemplate.message,
      notificationType: this.mapTypeToNotificationType(createdTemplate.type),
      isActive: createdTemplate.isActive,
      createdAt: createdTemplate.createdAt,
      updatedAt: createdTemplate.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a notification template (admin)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiBody({ type: UpdateNotificationTemplateDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'The notification template has been successfully updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Template not found' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateDto> {
    // First check if template exists
    const templates = await this.notificationService.getTemplates({ id });
    
    if (!templates || templates.length === 0) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    // Convert DTO to entity format
    const templateData: any = { id };
    
    if (updateDto.title !== undefined) {
      templateData.title = updateDto.title;
    }
    
    if (updateDto.body !== undefined) {
      templateData.message = updateDto.body;
    }
    
    if (updateDto.notificationType !== undefined) {
      templateData.type = this.mapNotificationTypeToType(updateDto.notificationType);
    }
    
    if (updateDto.isActive !== undefined) {
      templateData.isActive = updateDto.isActive;
    }
    
    // Update the template
    const updatedTemplate = await this.notificationService.createTemplate(templateData);
    
    // Map entity back to DTO
    return {
      id: updatedTemplate.id,
      moduleId: updatedTemplate.gameFeature || '',
      title: updatedTemplate.title,
      body: updatedTemplate.message,
      notificationType: this.mapTypeToNotificationType(updatedTemplate.type),
      isActive: updatedTemplate.isActive,
      createdAt: updatedTemplate.createdAt,
      updatedAt: updatedTemplate.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification template (admin)' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'The notification template has been successfully deleted' })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    // We don't have a direct delete method in the service, so we'll mark it as inactive
    await this.notificationService.createTemplate({
      id,
      isActive: false
    });
    
    return;
  }

  // Schedule management endpoints (from notification.controller.ts)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('schedules')
  @ApiOperation({ summary: 'Get all notification schedules (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of notification schedules',
  })
  async getAllSchedules(): Promise<{ schedules: NotificationScheduleDto[], totalCount: number }> {
    // This functionality would need to be implemented in the service
    return { schedules: [], totalCount: 0 };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('schedules')
  @ApiOperation({ summary: 'Create a new notification schedule (admin)' })
  @ApiBody({ type: CreateNotificationScheduleDto })
  @ApiResponse({
    status: 201,
    description: 'The notification schedule has been successfully created',
  })
  async createSchedule(@Body() createDto: CreateNotificationScheduleDto): Promise<NotificationScheduleDto> {
    // Convert DTO to entity format
    const scheduleData = {
      moduleId: createDto.moduleId,
      templateId: createDto.templateId,
      eventName: createDto.triggerType,
      cronExpression: null,
      isActive: createDto.isActive ?? true,
      conditions: {
        triggerHours: createDto.triggerHours,
        triggerTime: createDto.triggerTime
      }
    };
    
    const createdSchedule = await this.notificationService.createOrUpdateSchedule(scheduleData);
    
    // Map entity back to DTO
    return {
      id: createdSchedule.id,
      moduleId: createdSchedule.moduleId,
      templateId: createdSchedule.templateId,
      templateTitle: '',  // This would need to be fetched from the template
      triggerType: createdSchedule.eventName as TriggerType,
      triggerHours: createdSchedule.conditions?.triggerHours,
      triggerTime: createdSchedule.conditions?.triggerTime,
      isActive: createdSchedule.isActive,
      createdAt: createdSchedule.createdAt,
      updatedAt: createdSchedule.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update a notification schedule (admin)' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateNotificationScheduleDto })
  @ApiResponse({
    status: 200,
    description: 'The notification schedule has been successfully updated',
  })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationScheduleDto
  ): Promise<NotificationScheduleDto> {
    const scheduleData: any = { id };
    
    if (updateDto.templateId) scheduleData.templateId = updateDto.templateId;
    if (updateDto.triggerType) scheduleData.eventName = updateDto.triggerType;
    if (updateDto.isActive !== undefined) scheduleData.isActive = updateDto.isActive;
    
    // Update conditions if we have either triggerHours or triggerTime
    if (updateDto.triggerHours !== undefined || updateDto.triggerTime !== undefined) {
      scheduleData.conditions = {};
      if (updateDto.triggerHours !== undefined) {
        scheduleData.conditions.triggerHours = updateDto.triggerHours;
      }
      if (updateDto.triggerTime !== undefined) {
        scheduleData.conditions.triggerTime = updateDto.triggerTime;
      }
    }
    
    const updatedSchedule = await this.notificationService.createOrUpdateSchedule(scheduleData);
    
    // Map entity back to DTO
    return {
      id: updatedSchedule.id,
      moduleId: updatedSchedule.moduleId,
      templateId: updatedSchedule.templateId,
      templateTitle: '',  // This would need to be fetched from the template
      triggerType: updatedSchedule.eventName as TriggerType,
      triggerHours: updatedSchedule.conditions?.triggerHours,
      triggerTime: updatedSchedule.conditions?.triggerTime,
      isActive: updatedSchedule.isActive,
      createdAt: updatedSchedule.createdAt,
      updatedAt: updatedSchedule.updatedAt
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification schedule (admin)' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 204, description: 'The notification schedule has been successfully deleted' })
  async deleteSchedule(@Param('id') id: string): Promise<void> {
    // Mark as inactive instead of deleting
    await this.notificationService.createOrUpdateSchedule({
      id,
      isActive: false
    });
    return;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('send-test/:templateId')
  @ApiOperation({ summary: 'Send a test notification (admin)' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test notification sent' })
  async sendTestNotification(
    @Param('templateId') templateId: string,
    @Body() body: { userId: string }
  ): Promise<NotificationResultDto> {
    await this.notificationService.sendNotification(
      templateId,
      body.userId,
      { isTest: true }
    );
    
    return { 
      success: true, 
      message: 'Test notification sent' 
    };
  }

  // Module-specific notifications
  @UseGuards(JwtAuthGuard)
  @Get('module/:moduleId')
  @ApiOperation({ summary: "Get user's notifications for a specific module" })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({ status: HttpStatus.OK, description: "User's notifications for a module" })
  async getModuleNotifications(
    @GetUser() user: User,
    @Param('moduleId') moduleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<UserNotificationListDto> {
    const result = await this.notificationService.getUserNotifications(user.id, {
      limit,
      offset: (page - 1) * limit,
    });
    
    // Filter for module-specific notifications
    const moduleEntities = result.notifications.filter(
      notification => notification.customData?.moduleId === moduleId
    );
    
    // Map entities to DTOs
    const moduleNotifications: UserNotificationDto[] = moduleEntities.map(notification => ({
      id: notification.id,
      userId: notification.userId,
      moduleId: notification.customData?.moduleId || '',
      templateId: notification.templateId,
      scheduleId: notification.customData?.scheduleId,
      title: notification.template?.title || '',
      body: notification.template?.message || '',
      scheduledFor: notification.createdAt,
      sentAt: notification.createdAt,
      isRead: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    }));
    
    return {
      notifications: moduleNotifications,
      totalCount: moduleNotifications.length,
      unreadCount: moduleNotifications.filter(n => !n.isRead).length
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming/:moduleId')
  @ApiOperation({ summary: 'Get upcoming notifications for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming notifications for the module',
  })
  async getUpcomingNotifications(
    @GetUser() user: User,
    @Param('moduleId') moduleId: string,
  ): Promise<UpcomingNotificationListDto> {
    // This endpoint would need to be implemented in the service
    return {
      moduleId,
      notifications: []
    };
  }

  // Helper method to map entity type to DTO type
  private mapTypeToNotificationType(type: 'info' | 'success' | 'warning' | 'error'): NotificationType {
    switch (type) {
      case 'info':
        return NotificationType.REMINDER;
      case 'success':
        return NotificationType.ACHIEVEMENT;
      case 'warning':
        return NotificationType.ANNOUNCEMENT;
      case 'error':
        return NotificationType.CUSTOM;
      default:
        return NotificationType.CUSTOM;
    }
  }

  // Helper method to map DTO type to entity type
  private mapNotificationTypeToType(notificationType: NotificationType): 'info' | 'success' | 'warning' | 'error' {
    switch (notificationType) {
      case NotificationType.REMINDER:
      case NotificationType.MODULE_UNLOCK:
      case NotificationType.SECTION_UNLOCKED:
        return 'info';
      case NotificationType.ACHIEVEMENT:
      case NotificationType.REWARD_EARNED:
      case NotificationType.MODULE_COMPLETED:
      case NotificationType.SECTION_COMPLETED:
        return 'success';
      case NotificationType.ANNOUNCEMENT:
        return 'warning';
      case NotificationType.CUSTOM:
      case NotificationType.EXPEDITED_UNLOCK:
      default:
        return 'info';
    }
  }
}