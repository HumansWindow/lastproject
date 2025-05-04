# Learn-to-Earn Game Notification System Checklist

## Overview

The notification system delivers timely and relevant notifications to users about their progress, upcoming module unlocks, achievements, and educational content.

## Implementation Checklist

### ✅ Completed Tasks

1. **Database Structure**
   - [x] Created GameNotificationTemplate entity
   - [x] Created ModuleNotificationSchedule entity
   - [x] Created UserNotification entity
   - [x] Defined relationships between entities

2. **Backend Services & Infrastructure**
   - [x] Implemented GameNotificationService
   - [x] Created GameWebSocketGateway for real-time notifications
   - [x] Built WebSocket channel subscription system
   - [x] Integrated with existing WebSocket infrastructure

3. **Notification Types Implementation**
   - [x] Module unlock notifications
   - [x] Achievement notifications
   - [x] XP earned notifications
   - [x] Waiting period update notifications

4. **Frontend Components**
   - [x] Created notification bell with unread count
   - [x] Implemented notification panel component
   - [x] Added notification action routing

### 📋 Pending Tasks

1. **Admin Interface**
   - [ ] Create admin UI for notification templates
   - [ ] Build template creation/editing forms
   - [ ] Add template testing functionality
   - [ ] Implement template variables preview

2. **Notification Scheduling**
   - [ ] Create background job for notification processing
   - [ ] Implement retry mechanism for failed notifications
   - [ ] Add scheduling logic for different trigger types

3. **Additional Notification Channels**
   - [ ] Email notification integration
   - [ ] Push notification for mobile devices
   - [ ] Browser notification support
   - [ ] User preference management for channels

4. **Analytics & Optimization**
   - [ ] Track notification engagement metrics
   - [ ] Build dashboard for notification analytics
   - [ ] Implement A/B testing for effectiveness
   - [ ] Optimize database queries and caching

5. **Testing & Documentation**
   - [ ] Create comprehensive unit tests
   - [ ] Add integration tests for WebSocket functionality
   - [ ] Complete technical documentation
   - [ ] Create user guide for notification features

## Integration Points

- **Module Unlock System**: Schedules notifications when modules are unlocked
- **Achievement System**: Sends notifications when achievements are earned
- **XP System**: Notifies users about XP earned
- **User Progress**: Updates users on their learning progress


# Learn-to-Earn Game Notification System

## Overview

The notification system is a critical component of the Learn-to-Earn game platform, designed to enhance user engagement, retention, and learning outcomes. The system delivers timely and relevant notifications to users about their progress, upcoming module unlocks, achievements, and educational content.

## Key Features

1. **Notification Templates**
   - Customizable notification content with variable placeholders
   - Support for different notification types (module unlock, achievement, reminder, etc.)
   - Module-specific template configurations

2. **Scheduled Notifications**
   - Time-based triggers (e.g., 4 hours after completion, 24 hours before unlock)
   - Special time delivery options (morning notifications, evening reminders)
   - Smart delivery based on user activity patterns

3. **Notification Channels**
   - In-app notifications
   - Email notifications (with unsubscribe options)
   - Push notifications for mobile users
   - Browser notifications for web users

4. **Notification Management**
   - Admin interface for creating and managing notification templates
   - Analytics for notification engagement
   - User preference management

## Implementation Status

### Completed Tasks

1. **Backend Foundation**
   - Created database entities: `GameNotificationTemplate`, `ModuleNotificationSchedule`, `UserNotification`
   - Implemented `GameNotificationService` for handling notifications
   - Built `GameWebSocketGateway` for real-time notifications
   - Created API endpoints for fetching and managing notifications

2. **Frontend Components**
   - Designed notification bell with unread count indicator
   - Implemented notification panel component
   - Created notification service that integrates with WebSocket
   - Added notification actions (mark as read, view details)

3. **Real-time Integration**
   - Implemented WebSocket subscription for notifications
   - Created channel-based notification system
   - Integrated with existing WebSocket infrastructure

### Pending Tasks

1. **Notification Templates Admin Interface**
   - Create admin UI for template management
   - Implement template variables preview
   - Add template cloning functionality

2. **Scheduled Notification Processing**
   - Implement notification scheduler background job
   - Add retry mechanism for failed notifications
   - Create notification queue management

3. **Advanced Notification Features**
   - Email notification integration
   - Push notification for mobile devices
   - Browser notification support
   - User preference management

4. **Analytics and Reporting**
   - Track notification engagement metrics
   - Develop dashboard for notification analytics
   - Implement A/B testing for notification effectiveness

5. **Testing and Optimization**
   - Unit tests for notification services
   - Integration tests for real-time functionality
   - Performance testing under load
   - Optimization of database queries

## Integration with Module Unlock System

The notification system works closely with the module unlock system to:

1. **Schedule Module Unlock Notifications**
   - When a module is completed, the system automatically schedules notifications for the next module's unlock
   - Notifications can be configured to be sent at specific time intervals before unlock (e.g., 24 hours, 4 hours, 1 hour)
   - Immediate notifications are sent when modules are unlocked, either through timer completion or expedited unlock

2. **Tracking Waiting Periods**
   - When a module has a waiting period, the notification system helps keep users engaged during the wait
   - "Halfway through" notifications can be sent to maintain interest
   - Countdown notifications can build anticipation as the unlock time approaches

3. **Expedited Unlock Notifications**
   - Special notifications are sent when a user chooses to expedite (pay to skip) a module's waiting period
   - These notifications can include custom messaging specific to expedited unlocks

4. **Module Access Notifications**
   - When a module becomes available (waiting period ends), the system sends an immediate notification
   - These notifications include direct links to start the newly unlocked module

## Database Schema

```sql
CREATE TABLE game_notification_templates (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'achievement', 'unlock', 'expedited_unlock', 'custom'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE module_notification_schedule (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  template_id UUID REFERENCES game_notification_templates(id) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'time_after_completion', 'specific_time', 'before_unlock'
  trigger_hours INT, -- Hours after previous module completion or before unlock (can be NULL for specific_time)
  trigger_time TIME, -- Specific time of day (can be NULL for hour-based triggers)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES game_modules(id) NOT NULL,
  template_id UUID REFERENCES game_notification_templates(id),
  schedule_id UUID REFERENCES module_notification_schedule(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Details

### GameNotificationService

```typescript
@Injectable()
export class GameNotificationService {
  constructor(
    private readonly notificationTemplateRepository: GameNotificationTemplateRepository,
    private readonly notificationScheduleRepository: ModuleNotificationScheduleRepository,
    private readonly userNotificationRepository: UserNotificationRepository,
    private readonly gameModuleRepository: GameModuleRepository
  ) {}

  async scheduleUnlockNotifications(
    userId: string, 
    moduleId: string, 
    unlockDate: Date,
    waitTimeHours: number
  ): Promise<void> {
    // Get the module information
    const module = await this.gameModuleRepository.findOne(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Get notification schedules for this module
    const schedules = await this.notificationScheduleRepository.findByModule(moduleId);
    
    for (const schedule of schedules) {
      // Skip inactive schedules
      if (!schedule.is_active) continue;

      // Calculate notification time based on schedule type
      let notificationTime: Date;
      
      switch (schedule.trigger_type) {
        case 'before_unlock':
          // Schedule notification X hours before unlock
          notificationTime = new Date(unlockDate.getTime());
          notificationTime.setHours(notificationTime.getHours() - schedule.trigger_hours);
          break;
          
        case 'specific_time':
          // Schedule at specific time on the unlock day
          notificationTime = new Date(unlockDate.getTime());
          notificationTime.setHours(
            parseInt(schedule.trigger_time.split(':')[0]),
            parseInt(schedule.trigger_time.split(':')[1]),
            0, 0
          );
          
          // If this time is in the past for today, skip
          if (notificationTime < new Date()) continue;
          break;
          
        default:
          continue;
      }
      
      // Get the template
      const template = await this.notificationTemplateRepository.findOne(schedule.template_id);
      
      if (!template || !template.is_active) continue;
      
      // Create the notification
      await this.userNotificationRepository.create({
        user_id: userId,
        module_id: moduleId,
        template_id: template.id,
        schedule_id: schedule.id,
        title: template.title.replace('{module_title}', module.title),
        body: template.body
          .replace('{module_title}', module.title)
          .replace('{unlock_date}', unlockDate.toLocaleDateString())
          .replace('{wait_time}', `${waitTimeHours} hours`),
        scheduled_for: notificationTime,
        sent_at: null,
        is_read: false,
        read_at: null
      });
    }
  }

  async sendImmediateUnlockNotification(
    userId: string,
    moduleId: string,
    unlockType: 'timer_completed' | 'expedited' | 'admin_action'
  ): Promise<void> {
    // Get the module information
    const module = await this.gameModuleRepository.findOne(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    
    // Find an appropriate notification template based on the unlock type
    const templateType = unlockType === 'expedited' ? 'expedited_unlock' : 'module_unlock';
    const template = await this.notificationTemplateRepository.findOneByType(moduleId, templateType);
    
    if (!template) {
      // Fall back to a default template if none is configured
      const title = `Module Unlocked: ${module.title}`;
      const body = `You've unlocked the "${module.title}" module! Click here to start learning.`;
      
      // Create and send the notification immediately
      await this.userNotificationRepository.create({
        user_id: userId,
        module_id: moduleId,
        title,
        body,
        scheduled_for: new Date(), // Now
        sent_at: new Date(),
        is_read: false,
        read_at: null
      });
      
      return;
    }
    
    // Create the notification using the template
    await this.userNotificationRepository.create({
      user_id: userId,
      module_id: moduleId,
      template_id: template.id,
      title: template.title.replace('{module_title}', module.title),
      body: template.body.replace('{module_title}', module.title),
      scheduled_for: new Date(), // Now
      sent_at: new Date(),
      is_read: false,
      read_at: null
    });
  }

  async getUpcomingNotifications(
    userId: string,
    moduleId: string
  ): Promise<UpcomingNotificationListDto> {
    // Find all scheduled notifications for this user and module that haven't been sent yet
    const notifications = await this.userNotificationRepository.findUpcoming(userId, moduleId);
    
    return {
      moduleId,
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        scheduledFor: notification.scheduled_for
      }))
    };
  }

  async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      includeRead?: boolean;
    } = {}
  ): Promise<PaginatedUserNotificationsDto> {
    return this.userNotificationRepository.findByUser(
      userId, 
      options.limit || 20,
      options.offset || 0,
      options.includeRead || false
    );
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string
  ): Promise<void> {
    await this.userNotificationRepository.markAsRead(notificationId, userId);
  }

  async markAllNotificationsAsRead(
    userId: string
  ): Promise<void> {
    await this.userNotificationRepository.markAllAsRead(userId);
  }
}
```

### Module Unlock Integration

The GameNotificationService is tightly integrated with the ModuleUnlockService to ensure users receive appropriate notifications about their learning journey:

```typescript
// In ModuleUnlockService
async scheduleModuleUnlock(userId: string, completedModuleId: string): Promise<ModuleUnlockInfoDto> {
  // Get next module in sequence
  const completedModule = await this.gameModuleRepository.findOne(completedModuleId);
  const nextModule = await this.gameModuleRepository.findNextInSequence(completedModuleId);
  
  if (!nextModule) {
    return { hasNextModule: false };
  }
  
  // Calculate unlock date based on waiting period
  const waitTimeHours = nextModule.wait_time_hours || 0;
  const unlockDate = new Date();
  unlockDate.setHours(unlockDate.getHours() + waitTimeHours);
  
  // Create or update unlock schedule entry
  await this.moduleUnlockRepository.createOrUpdate({
    user_id: userId,
    module_id: nextModule.id,
    previous_module_id: completedModuleId,
    unlock_date: unlockDate,
    is_unlocked: waitTimeHours === 0 // Auto-unlock if no waiting period
  });
  
  // Schedule notifications for this module unlock
  await this.gameNotificationService.scheduleUnlockNotifications(
    userId,
    nextModule.id,
    unlockDate,
    waitTimeHours
  );
  
  return {
    hasNextModule: true,
    nextModuleId: nextModule.id,
    nextModuleTitle: nextModule.title,
    unlockDate: unlockDate,
    waitTimeHours: waitTimeHours
  };
}

async expediteUnlock(userId: string, moduleId: string, paymentInfo: PaymentInfoDto): Promise<ExpediteResultDto> {
  // Process payment and unlock module
  const result = await this.processExpeditePayment(userId, moduleId, paymentInfo);
  
  if (result.success) {
    // Mark as unlocked
    await this.moduleUnlockRepository.markAsUnlocked(result.unlockScheduleId);
    
    // Send immediate unlock notification
    await this.gameNotificationService.sendImmediateUnlockNotification(
      userId,
      moduleId,
      'expedited'
    );
  }
  
  return result;
}
```

### NotificationController

```typescript
@Controller('game/notifications')
@UseGuards(AuthGuard('jwt'))
export class GameNotificationController {
  constructor(
    private readonly gameNotificationService: GameNotificationService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'includeRead', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns paginated notifications' })
  async getUserNotifications(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('includeRead') includeRead?: boolean
  ): Promise<PaginatedUserNotificationsDto> {
    return this.gameNotificationService.getUserNotifications(req.user.id, {
      limit, 
      offset, 
      includeRead: !!includeRead
    });
  }

  @Get('count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread notification count' })
  async getUnreadCount(@Req() req: RequestWithUser): Promise<{ count: number }> {
    const result = await this.gameNotificationService.getUserNotifications(req.user.id, {
      limit: 0,
      offset: 0,
      includeRead: false
    });
    
    return { count: result.total };
  }

  @Post(':notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Req() req: RequestWithUser,
    @Param('notificationId') notificationId: string
  ): Promise<{ success: boolean }> {
    await this.gameNotificationService.markNotificationAsRead(
      req.user.id,
      notificationId
    );
    
    return { success: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: RequestWithUser): Promise<{ success: boolean }> {
    await this.gameNotificationService.markAllNotificationsAsRead(req.user.id);
    return { success: true };
  }
}
```

## Frontend Integration

The notification system interfaces with the frontend through:

1. **Real-time Notification Delivery**
   - WebSocket connection for instant notifications
   - Notification bell icon with unread count
   - Notification drawer with all notifications

2. **Notification Actions**
   - Click to navigate to relevant content
   - Mark as read/unread
   - Clear all notifications

3. **Notification Settings**
   - Preferences for notification types
   - Channel preferences (in-app, email, push)
   - Time preferences for notifications

## Administrator Features

Administrators can manage the notification system through:

1. **Template Management**
   - Create and edit notification templates
   - Preview templates with sample data
   - Clone existing templates for quick creation

2. **Schedule Configuration**
   - Set up notification schedules for modules
   - Configure time-based triggers
   - Enable/disable specific notifications

3. **Analytics Dashboard**
   - View notification delivery statistics
   - Track open rates and engagement
   - Identify most effective notification types

## Best Practices

1. **Notification Frequency**
   - Avoid notification fatigue by limiting frequency
   - Group related notifications when possible
   - Respect user preferences and quiet hours

2. **Content Quality**
   - Keep notifications concise and actionable
   - Include personalization elements when appropriate
   - Use clear calls to action

3. **Technical Performance**
   - Batch notification processing for efficiency
   - Implement retry mechanisms for failed deliveries
   - Cache frequently accessed notification data