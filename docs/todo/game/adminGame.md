# Learn-to-Earn Game: Admin Interface

## Overview

The admin interface for the Learn-to-Earn game provides comprehensive tools for content management, user progress tracking, and system configuration. This document outlines the key features and implementation details of the admin interface, focusing on the management of game modules, sections, notifications, and module unlock settings.

## Main Features

### Module Management

1. **Module Overview**
   - List all modules with status, completion metrics, and unlock statistics
   - Filter and search modules by various criteria
   - Quick access to module editing and preview

2. **Module Editor**
   - Create and edit module details (title, description, order, etc.)
   - Set module prerequisites and dependencies
   - Configure waiting periods between modules
   - Set reward amounts for module completion

3. **Module Analytics**
   - View completion rates and average time spent
   - Track user engagement metrics
   - Identify bottlenecks or challenging sections

### Section Management

1. **Section Editor**
   - Drag-and-drop interface for arranging section content
   - WYSIWYG editor for text and rich media content
   - Preview functionality to see section as users would

2. **Section Types**
   - Configure text-image sections with layout options
   - Design card carousel sections with interactive elements
   - Create timeline sections with sequential content
   - Build quiz sections with various question types

3. **Waiting Period Configuration**
   - Set section-specific waiting periods
   - Preview user journey with timing considerations
   - Configure override options for paid expedites

### Media Asset Management

1. **Asset Library**
   - Upload and organize images, videos, and other media assets
   - Tag and categorize assets for easy retrieval
   - Track asset usage across modules and sections

2. **Image Editor**
   - Basic cropping, resizing, and optimization tools
   - Alt text and accessibility configuration
   - Image preview across different device sizes

### Quiz Management

1. **Question Bank**
   - Create and organize quiz questions by topic or category
   - Import/export questions in bulk
   - Track question performance and difficulty

2. **Quiz Builder**
   - Design quizzes with mixed question types
   - Set scoring rules and passing thresholds
   - Configure feedback for correct/incorrect answers

## Notification System Administration

### Template Management

1. **Notification Template Editor**
   - Create and edit notification templates with variable placeholders
   - Preview templates with sample data
   - Set default templates for common notification types

2. **Template Categories**
   - Module unlock notifications
   - Module completion reminders
   - Achievement notifications
   - Learning streak notifications
   - Custom promotional notifications

3. **Template Variables**
   - `{module_title}` - Module name
   - `{unlock_date}` - Date when module unlocks
   - `{wait_time}` - Waiting period duration
   - `{user_name}` - User's name
   - `{completion_percentage}` - Overall game completion percentage

### Notification Schedule Configuration

1. **Schedule Builder**
   - Configure notification triggers based on user actions or time
   - Set up reminders at specific intervals before module unlocks
   - Configure follow-up notifications after module completion

2. **Trigger Types**
   - `before_unlock`: Send notification X hours before module unlocks
   - `time_after_completion`: Send notification X hours after completing previous module
   - `specific_time`: Send notification at specific time of day on unlock date
   - `achievement`: Send notification when achievement unlocked
   - `inactivity`: Send notification after X days of inactivity

3. **Scheduling Rules**
   - Configure blackout periods (e.g., no notifications at night)
   - Set maximum notifications per day/week
   - Configure notification priority rules

### Notification Analytics Dashboard

1. **Delivery Metrics**
   - Track notification delivery rates and failures
   - Monitor open rates and engagement statistics
   - View notification trends over time

2. **Effectiveness Analysis**
   - Measure conversion from notification to module engagement
   - A/B testing capabilities for notification content
   - Identify most and least effective notification templates

3. **User Preference Insights**
   - Track notification opt-out rates
   - Analyze preferred notification channels
   - Identify user segments by notification engagement

## Module Unlock System Administration

### Unlock Configuration

1. **Global Settings**
   - Set default waiting periods between modules
   - Configure minimum and maximum waiting times
   - Enable/disable expedited unlocking feature

2. **Module-Specific Settings**
   - Override global waiting periods for specific modules
   - Configure special unlock conditions beyond time-based rules
   - Set custom pricing for expedited unlocks

3. **Unlock Preview**
   - Visualize module unlock sequence and timing
   - Preview user journey with configured waiting periods
   - Simulate different completion scenarios

### Unlock Management Tools

1. **Manual Override**
   - Force unlock modules for specific users
   - Grant universal access to selected users (e.g., testers, educators)
   - Lock previously unlocked modules if necessary

2. **Bulk Operations**
   - Unlock modules for user segments or cohorts
   - Adjust waiting periods for multiple modules
   - Reset unlock status for testing or course resets

3. **User Lookup**
   - Search for specific users and view their unlock status
   - See upcoming unlocks for any user
   - View unlock history and timing

### Expedited Unlock Management

1. **Pricing Configuration**
   - Set token prices for skipping waiting periods
   - Configure dynamic pricing based on waiting time remaining
   - Create discount rules and promotions

2. **Transaction Monitoring**
   - View expedited unlock purchase history
   - Track revenue from expedited unlocks
   - Monitor for unusual patterns or potential abuse

3. **Reporting Dashboard**
   - Analyze expedited unlock conversion rates
   - Track revenue and usage patterns
   - Compare standard progression vs. expedited user journeys

## User Management

1. **User Progress View**
   - See individual user progress across all modules
   - View completion timestamps and quiz scores
   - Access detailed section-by-section progress

2. **User Grouping & Cohorts**
   - Create user groups for specialized content or pacing
   - Track and compare cohort performance
   - Apply bulk actions to cohorts

3. **Access Control**
   - Grant or revoke access to specific modules
   - Configure special access rules for beta testers
   - Apply temporary restrictions when needed

## Reward System Administration

1. **Reward Configuration**
   - Set token reward amounts for module completion
   - Configure bonus rewards for high quiz scores
   - Define special achievement rewards

2. **Transaction Monitoring**
   - View token distribution history
   - Track pending, completed, and failed rewards
   - Issue manual rewards when necessary

3. **Analysis Tools**
   - Calculate token economy metrics
   - Track user motivation through reward engagement
   - Optimize reward amounts based on user behavior

## Implementation Details

### Admin Module Structure

```
backend/
└── src/
    └── admin/
        └── game/
            ├── controllers/
            │   ├── admin-game-modules.controller.ts
            │   ├── admin-game-sections.controller.ts
            │   ├── admin-quiz.controller.ts
            │   ├── admin-media.controller.ts
            │   ├── admin-module-unlock.controller.ts
            │   ├── admin-notification.controller.ts
            │   └── admin-game-analytics.controller.ts
            ├── services/
            │   ├── admin-game-modules.service.ts
            │   ├── admin-game-sections.service.ts
            │   ├── admin-quiz.service.ts
            │   ├── admin-media.service.ts
            │   ├── admin-module-unlock.service.ts
            │   ├── admin-notification.service.ts
            │   └── admin-game-analytics.service.ts
            └── dto/
                ├── admin-module.dto.ts
                ├── admin-section.dto.ts
                ├── admin-quiz.dto.ts
                ├── admin-media.dto.ts
                ├── admin-unlock.dto.ts
                ├── admin-notification.dto.ts
                └── admin-analytics.dto.ts
```

### Admin API Endpoints

#### Module Management

```
GET    /api/admin/game/modules
POST   /api/admin/game/modules
GET    /api/admin/game/modules/:id
PUT    /api/admin/game/modules/:id
DELETE /api/admin/game/modules/:id
GET    /api/admin/game/modules/analytics
```

#### Section Management

```
GET    /api/admin/game/sections
POST   /api/admin/game/sections
GET    /api/admin/game/sections/:id
PUT    /api/admin/game/sections/:id
DELETE /api/admin/game/sections/:id
POST   /api/admin/game/sections/reorder
```

#### Notification Management

```
GET    /api/admin/game/notifications/templates
POST   /api/admin/game/notifications/templates
GET    /api/admin/game/notifications/templates/:id
PUT    /api/admin/game/notifications/templates/:id
DELETE /api/admin/game/notifications/templates/:id
POST   /api/admin/game/notifications/templates/:id/preview
GET    /api/admin/game/notifications/schedules
POST   /api/admin/game/notifications/schedules
GET    /api/admin/game/notifications/schedules/:id
PUT    /api/admin/game/notifications/schedules/:id
DELETE /api/admin/game/notifications/schedules/:id
GET    /api/admin/game/notifications/analytics
GET    /api/admin/game/notifications/user/:userId
POST   /api/admin/game/notifications/send
```

#### Unlock Management

```
GET    /api/admin/game/unlocks/config
PUT    /api/admin/game/unlocks/config
GET    /api/admin/game/unlocks/modules/:moduleId
PUT    /api/admin/game/unlocks/modules/:moduleId
GET    /api/admin/game/unlocks/user/:userId
POST   /api/admin/game/unlocks/manual
POST   /api/admin/game/unlocks/bulk
GET    /api/admin/game/unlocks/expedited
PUT    /api/admin/game/unlocks/expedited/pricing
GET    /api/admin/game/unlocks/analytics
```

### Module Unlock Admin Controller Implementation

```typescript
@Controller('admin/game/unlocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminModuleUnlockController {
  constructor(
    private readonly moduleUnlockService: ModuleUnlockService,
    private readonly gameModuleService: GameModuleService,
    private readonly gameNotificationService: GameNotificationService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Get global unlock configuration' })
  @ApiResponse({ status: 200, description: 'Returns unlock configuration' })
  async getUnlockConfig(): Promise<UnlockConfigDto> {
    return this.moduleUnlockService.getUnlockConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update global unlock configuration' })
  @ApiBody({ type: UpdateUnlockConfigDto })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateUnlockConfig(@Body() config: UpdateUnlockConfigDto): Promise<UnlockConfigDto> {
    return this.moduleUnlockService.updateUnlockConfig(config);
  }

  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get module-specific unlock settings' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Returns module unlock settings' })
  async getModuleUnlockSettings(@Param('moduleId') moduleId: string): Promise<ModuleUnlockSettingsDto> {
    return this.moduleUnlockService.getModuleUnlockSettings(moduleId);
  }

  @Put('modules/:moduleId')
  @ApiOperation({ summary: 'Update module-specific unlock settings' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiBody({ type: UpdateModuleUnlockSettingsDto })
  @ApiResponse({ status: 200, description: 'Module unlock settings updated' })
  async updateModuleUnlockSettings(
    @Param('moduleId') moduleId: string,
    @Body() settings: UpdateModuleUnlockSettingsDto
  ): Promise<ModuleUnlockSettingsDto> {
    return this.moduleUnlockService.updateModuleUnlockSettings(moduleId, settings);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get unlock status for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user unlock status' })
  async getUserUnlockStatus(@Param('userId') userId: string): Promise<UserUnlockStatusDto> {
    return this.moduleUnlockService.getUserUnlockStatus(userId);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Manually override module unlock for a user' })
  @ApiBody({ type: ManualUnlockDto })
  @ApiResponse({ status: 200, description: 'Module unlocked successfully' })
  async manualUnlock(@Body() unlockData: ManualUnlockDto): Promise<ManualUnlockResultDto> {
    const result = await this.moduleUnlockService.manualUnlock(
      unlockData.userId,
      unlockData.moduleId,
      unlockData.unlock,
      unlockData.reason
    );
    
    // If unlocking a module, send notification
    if (unlockData.unlock && result.success) {
      await this.gameNotificationService.sendImmediateUnlockNotification(
        unlockData.userId,
        unlockData.moduleId,
        'admin_action'
      );
    }
    
    return result;
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk unlock operations' })
  @ApiBody({ type: BulkUnlockDto })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  async bulkUnlock(@Body() bulkData: BulkUnlockDto): Promise<BulkUnlockResultDto> {
    const result = await this.moduleUnlockService.bulkUnlock(
      bulkData.userIds,
      bulkData.moduleId,
      bulkData.unlock,
      bulkData.reason
    );
    
    // If unlocking, send notifications to all affected users
    if (bulkData.unlock && bulkData.sendNotification) {
      for (const userId of result.successUsers) {
        await this.gameNotificationService.sendImmediateUnlockNotification(
          userId,
          bulkData.moduleId,
          'admin_action'
        );
      }
    }
    
    return result;
  }

  @Get('expedited')
  @ApiOperation({ summary: 'Get expedited unlock analytics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns expedited unlock data' })
  async getExpeditedUnlockData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ExpeditedUnlockAnalyticsDto> {
    return this.moduleUnlockService.getExpeditedUnlockAnalytics(startDate, endDate);
  }

  @Put('expedited/pricing')
  @ApiOperation({ summary: 'Update expedited unlock pricing' })
  @ApiBody({ type: UpdateExpeditedPricingDto })
  @ApiResponse({ status: 200, description: 'Pricing updated successfully' })
  async updateExpeditedPricing(
    @Body() pricingData: UpdateExpeditedPricingDto
  ): Promise<ExpeditedPricingDto> {
    return this.moduleUnlockService.updateExpeditedPricing(pricingData);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get unlock system analytics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns unlock analytics' })
  async getUnlockAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<UnlockAnalyticsDto> {
    return this.moduleUnlockService.getUnlockAnalytics(startDate, endDate);
  }
}
```

### Notification Admin Controller Implementation

```typescript
@Controller('admin/game/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminNotificationController {
  constructor(
    private readonly gameNotificationService: GameNotificationService,
    private readonly gameModuleService: GameModuleService
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({ status: 200, description: 'Returns notification templates' })
  async getTemplates(): Promise<NotificationTemplateListDto> {
    return this.gameNotificationService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create new notification template' })
  @ApiBody({ type: CreateNotificationTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @Body() templateData: CreateNotificationTemplateDto
  ): Promise<NotificationTemplateDto> {
    return this.gameNotificationService.createTemplate(templateData);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Returns notification template' })
  async getTemplate(@Param('id') id: string): Promise<NotificationTemplateDto> {
    return this.gameNotificationService.getTemplate(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiBody({ type: UpdateNotificationTemplateDto })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() templateData: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateDto> {
    return this.gameNotificationService.updateTemplate(id, templateData);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.gameNotificationService.deleteTemplate(id);
    return { success: true };
  }

  @Post('templates/:id/preview')
  @ApiOperation({ summary: 'Preview notification template with sample data' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiBody({ type: NotificationPreviewDto })
  @ApiResponse({ status: 200, description: 'Returns template preview' })
  async previewTemplate(
    @Param('id') id: string,
    @Body() previewData: NotificationPreviewDto
  ): Promise<NotificationPreviewResultDto> {
    return this.gameNotificationService.previewTemplate(id, previewData);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Get notification schedules' })
  @ApiQuery({ name: 'moduleId', required: false })
  @ApiResponse({ status: 200, description: 'Returns notification schedules' })
  async getSchedules(@Query('moduleId') moduleId?: string): Promise<NotificationScheduleListDto> {
    return this.gameNotificationService.getSchedules(moduleId);
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Create notification schedule' })
  @ApiBody({ type: CreateNotificationScheduleDto })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  async createSchedule(
    @Body() scheduleData: CreateNotificationScheduleDto
  ): Promise<NotificationScheduleDto> {
    return this.gameNotificationService.createSchedule(scheduleData);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get notification schedule by ID' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Returns notification schedule' })
  async getSchedule(@Param('id') id: string): Promise<NotificationScheduleDto> {
    return this.gameNotificationService.getSchedule(id);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update notification schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateNotificationScheduleDto })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() scheduleData: UpdateNotificationScheduleDto
  ): Promise<NotificationScheduleDto> {
    return this.gameNotificationService.updateSchedule(id, scheduleData);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Delete notification schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  async deleteSchedule(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.gameNotificationService.deleteSchedule(id);
    return { success: true };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get notification analytics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Returns notification analytics' })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<NotificationAnalyticsDto> {
    return this.gameNotificationService.getAnalytics(startDate, endDate);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Returns user notifications' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<PaginatedUserNotificationsDto> {
    return this.gameNotificationService.getUserNotifications(userId, {
      limit,
      offset,
      includeRead: true
    });
  }

  @Post('send')
  @ApiOperation({ summary: 'Send custom notification to users' })
  @ApiBody({ type: SendCustomNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendCustomNotification(
    @Body() notificationData: SendCustomNotificationDto
  ): Promise<SendNotificationResultDto> {
    return this.gameNotificationService.sendCustomNotification(notificationData);
  }
}
```

## Frontend Admin Implementation

The frontend admin interface will be implemented as a dedicated section within the main admin panel, with specialized components for game management:

### Key UI Components

1. **Module Manager**
   - Module list with filtering and sorting
   - Module edit form with validation
   - Module sequence visualizer with drag-and-drop reordering

2. **Section Builder**
   - Component-based section editor
   - Live preview of section appearance
   - Media asset browser and selector

3. **Notification Manager**
   - Template library with search and filters
   - Template editor with variable selection
   - Schedule configuration interface

4. **Unlock Manager**
   - Module unlock configuration panel
   - User unlock status viewer
   - Manual override controls

5. **Analytics Dashboard**
   - Completion rate charts
   - User engagement metrics
   - Notification effectiveness reports

## Integration Points

1. **User System**
   - Access control based on admin roles and permissions
   - View and manage user progression through game content
   - Analyze user behavior and learning patterns

2. **Reward System**
   - Configure token rewards for module completion
   - Monitor reward distribution and balance
   - Set up special reward campaigns

3. **Blockchain Integration**
   - View on-chain reward transactions
   - Configure gas optimization settings
   - Set up transaction batching parameters

## Conclusion

The admin interface for the Learn-to-Earn game provides essential tools for managing educational content, tracking user progress, and configuring key system parameters. By implementing a comprehensive admin panel, we enable effective content management, data-driven decision making, and optimal user experience within the game platform.

Key features for notifications and module unlocks are fully integrated, giving administrators powerful tools to engage users through timely notifications while maintaining control over the educational pacing through the module unlock system.