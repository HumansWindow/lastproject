# Learn to Earn Game: Backend Architecture

## Overview

This document outlines the architecture of the Learn to Earn game backend system. The implementation follows the NestJS architecture patterns and integrates with the existing backend infrastructure.

## Module Structure

The game module is structured following NestJS best practices with a clear separation of concerns:

```
backend/
└── src/
    └── game/
        ├── game.module.ts                    # Main game module definition
        ├── controllers/
        │   ├── game-modules.controller.ts    # Module endpoints
        │   ├── game-sections.controller.ts   # Section endpoints
        │   ├── user-progress.controller.ts   # Progress tracking
        │   ├── quiz.controller.ts            # Quiz functionality
        │   ├── media.controller.ts           # Media management
        │   ├── rewards.controller.ts         # Reward system
        │   ├── module-unlock.controller.ts   # Module unlocks management
        │   ├── game-notification.controller.ts    # Game notification management
        │   ├── admin-content.controller.ts   # Admin content management
        │   ├── content-template.controller.ts # Content template management
        │   ├── content-approval.controller.ts   # Content approval workflow endpoints
        │   └── collaboration-comment.controller.ts # Collaboration feature endpoints
        ├── services/
        │   ├── game-modules.service.ts       # Module business logic
        │   ├── game-sections.service.ts      # Section business logic
        │   ├── user-progress.service.ts      # Progress tracking logic
        │   ├── quiz/
        │   │   └── quiz.service.ts           # Quiz business logic
        │   ├── media.service.ts              # Media handling
        │   ├── media-processing.service.ts   # Advanced media processing
        │   ├── rewards.service.ts            # Reward processing
        │   ├── module-unlock.service.ts      # Module unlock timing logic
        │   ├── game-notification.service.ts  # Game notification logic
        │   ├── content-template.service.ts   # Content template management
        │   ├── content-approval.service.ts      # Content approval workflow logic
        │   └── collaboration-comment.service.ts # Collaboration feature logic
        ├── dto/
        │   ├── module.dto.ts                 # Module DTOs
        │   ├── section.dto.ts                # Section DTOs
        │   ├── progress.dto.ts               # Progress DTOs
        │   ├── quiz/                         # Quiz DTOs
        │   │   ├── quiz.dto.ts               # Quiz data structures
        │   │   ├── quiz-question.dto.ts      # Quiz question data structures
        │   │   └── quiz-session.dto.ts       # Quiz session data structures
        │   ├── reward.dto.ts                 # Reward DTOs
        │   ├── unlock.dto.ts                 # Module unlock DTOs
        │   ├── notification.dto.ts           # Game notification DTOs
        │   ├── section-content.dto.ts        # Section content DTOs
        │   ├── content-statistics.dto.ts     # Content statistics DTOs
        │   ├── media-processing.dto.ts       # Media processing DTOs
        │   ├── content-template.dto.ts       # Content template DTOs
        │   ├── content-approval.dto.ts          # Content approval DTOs
        │   └── collaboration-comment.dto.ts     # Collaboration comment DTOs
        ├── entities/
        │   ├── game-module.entity.ts         # Module entity
        │   ├── game-section.entity.ts        # Section entity
        │   ├── section-content.entity.ts     # Content entity
        │   ├── media-asset.entity.ts         # Media entity
        │   ├── user-progress.entity.ts       # Progress entity
        │   ├── section-checkpoint.entity.ts  # Checkpoint entity
        │   ├── quiz/                         # Quiz entities
        │   │   ├── quiz.entity.ts            # Quiz configuration entity
        │   │   ├── quiz-question.entity.ts   # Quiz question entity
        │   │   ├── quiz-session.entity.ts    # Quiz session entity
        │   │   └── user-quiz-response.entity.ts # User response entity
        │   ├── reward-transaction.entity.ts  # Reward entity
        │   ├── module-unlock-schedule.entity.ts  # Module unlock entity
        │   ├── section-unlock-schedule.entity.ts # Section unlock entity
        │   ├── game-notification-template.entity.ts  # Notification template
        │   ├── module-notification-schedule.entity.ts # Notification schedule
        │   ├── user-notification.entity.ts   # User notification entity
        │   ├── content-version.entity.ts     # Content version history
        │   ├── content-template.entity.ts    # Content templates
        │   ├── content-approval.entity.ts       # Content approval entity
        │   └── collaboration-comment.entity.ts  # Collaboration comment entity
        ├── interfaces/
        │   ├── section-config.interface.ts   # Section configuration
        │   ├── content-types.interface.ts    # Content type definitions
        │   ├── progress-status.interface.ts  # Progress status types
        │   ├── quiz/                         # Quiz interfaces
        │   │   └── quiz-types.interface.ts   # Quiz type definitions and enums
        │   ├── unlock-status.interface.ts    # Module unlock status types
        │   ├── notification-types.interface.ts # Notification type definitions
        │   ├── media-processing.interface.ts # Media processing options
        │   └── content-template.interface.ts # Content template definitions
        ├── guards/
        │   ├── module-access.guard.ts        # Module access control
        │   └── module-unlock.guard.ts        # Module unlock verification
        ├── gateways/
        │   └── game-websocket.gateway.ts     # Game WebSocket gateway for real-time notifications
        ├── tasks/
        │   └── notification-sender.task.ts   # Notification delivery task
        └── repositories/
            ├── game-module.repository.ts     # Module data access
            ├── game-section.repository.ts    # Section data access
            ├── section-content.repository.ts # Content data access
            ├── user-progress.repository.ts   # Progress data access
            ├── module-unlock.repository.ts   # Module unlock data access
            ├── quiz/                         # Quiz repositories
            │   ├── quiz.repository.ts        # Quiz data access
            │   ├── quiz-question.repository.ts # Question data access
            │   ├── quiz-session.repository.ts # Session data access
            │   └── user-quiz-response.repository.ts # Response data access
            ├── game-notification.repository.ts # Game notification data access
            ├── media-asset.repository.ts     # Media asset data access
            ├── content-version.repository.ts # Content version history access
            ├── content-template.repository.ts # Content template data access
            ├── content-approval.repository.ts   # Content approval data access
            └── collaboration-comment.repository.ts # Collaboration comment data access
```

## Architecture Components

### Controllers

Controllers handle HTTP requests and delegate business logic to services. They are responsible for:

1. **Request validation** - Using DTOs with class-validator decorators
2. **Authentication** - Using Guards for access control
3. **Response formatting** - Mapping service results to HTTP responses
4. **Documentation** - Using Swagger decorators for API documentation

### Services

Services contain the core business logic and orchestrate the interactions between repositories and other services:

1. **Game Modules Service** - Manage educational module metadata and relationships
2. **Game Sections Service** - Handle section content and organization within modules
3. **User Progress Service** - Track and update user learning progress
4. **Quiz Service** - Manage quiz questions, answers, and scoring
5. **Media Service** - Handle media asset uploads, storage, and retrieval
6. **Media Processing Service** - Advanced media processing and optimization
7. **Rewards Service** - Calculate and process blockchain rewards
8. **Module Unlock Service** - Manage time-based module unlocking
9. **Game Notification Service** - Send and manage user notifications for game events
10. **Content Template Service** - Manage reusable content templates
11. **Content Approval Service** - Orchestrate content approval workflow
12. **Collaboration Comment Service** - Manage collaboration comments and feedback

### Repositories

Repositories provide an abstraction layer over the database:

1. **Game Module Repository** - Query and manage game modules
2. **Game Section Repository** - Access section data with content relationships
3. **Section Content Repository** - Manage section content data
4. **User Progress Repository** - Store and retrieve user progress data
5. **Module Unlock Repository** - Manage module unlock schedules
6. **Game Notification Repository** - Handle notification storage and queries
7. **Media Asset Repository** - Manage media asset data
8. **Content Version Repository** - Access content version history
9. **Content Template Repository** - Manage content template data
10. **Content Approval Repository** - Manage content approval data
11. **Collaboration Comment Repository** - Manage collaboration comment data

### DTOs (Data Transfer Objects)

DTOs define the structure of data exchanged between clients and the server:

1. **Request DTOs** - Define data received from clients
   - Enforce validation rules using class-validator decorators
   - Ensure type safety for incoming requests

2. **Response DTOs** - Define data sent to clients
   - Provide consistent API responses
   - Hide implementation details

### Entities

Entities represent database tables with their relationships:

1. **Game Module Entity** - Core educational module data
2. **Game Section Entity** - Educational section within modules
3. **Section Content Entity** - Content items within sections
4. **Media Asset Entity** - Uploaded media files metadata
5. **User Progress Entity** - User's progress through modules
6. **Section Checkpoint Entity** - Track user completion of sections
7. **Quiz Question Entity** - Questions in module quizzes
8. **User Quiz Response Entity** - User's answers to quiz questions
9. **Reward Transaction Entity** - Blockchain reward transactions
10. **Module Unlock Schedule Entity** - Schedule for module unlocking
11. **Section Unlock Schedule Entity** - Schedule for section unlocking
12. **Game Notification Template Entity** - Templates for notifications
13. **Module Notification Schedule Entity** - Scheduled notification delivery
14. **User Notification Entity** - User-specific notifications
15. **Content Version Entity** - Content version history
16. **Content Template Entity** - Content templates
17. **Content Approval Entity** - Content approval workflow data
18. **Collaboration Comment Entity** - Collaboration comments and feedback

### Interfaces

Interfaces define types used throughout the module:

1. **Section Config Interface** - Type definitions for section configurations
2. **Content Types Interface** - Types of content within sections
3. **Progress Status Interface** - Status types for user progress
4. **Unlock Status Interface** - Status types for module unlocking
5. **Notification Types Interface** - Types of notifications
6. **Media Processing Interface** - Media processing options
7. **Content Template Interface** - Content template definitions

### Guards

Guards provide authentication and authorization:

1. **Module Access Guard** - Verifies user has access to a module
2. **Module Unlock Guard** - Checks if a module is unlocked for a user

### Tasks

Scheduled tasks for background processing:

1. **Notification Sender Task** - Sends scheduled notifications to users

### Gateways

Gateways provide real-time communication:

1. **Game WebSocket Gateway** - Handles WebSocket connections for real-time notifications

## Service Integration

### Integration with User Service

The game module integrates with the existing user service to:
- Authenticate users
- Associate progress with user accounts
- Query user information for personalization

### Integration with Blockchain Module

The game module integrates with the blockchain module to:
- Process rewards for completed modules
- Verify token transactions
- Track reward distributions

### Integration with Notification System

The game module extends the application notification system to:
- Send module unlock notifications through WebSockets
- Schedule notifications for upcoming module unlocks
- Remind users of uncompleted modules
- Alert users of achievements earned and XP gained
- Track notification read/unread status

## Architectural Patterns

### Repository Pattern

The game module implements the Repository pattern through TypeORM repositories that:
- Abstract database operations
- Allow for easier unit testing
- Provide a consistent interface for data access

### Dependency Injection

NestJS's dependency injection is used to:
- Decouple components
- Facilitate testing with mock objects
- Manage service lifecycles

### DTO Pattern

The Data Transfer Object pattern is used to:
- Separate internal data representation from API contracts
- Validate incoming data
- Transform data between layers

### Observer Pattern

The notification system implements the Observer pattern to:
- Allow components to subscribe to events
- Decouple event producers from event consumers
- Enable asynchronous processing

## Error Handling Strategy

### Global Exception Filter

A global exception filter catches and transforms exceptions into appropriate HTTP responses:
- Maps database errors to 400 Bad Request
- Handles validation errors with descriptive messages
- Transforms service exceptions to appropriate HTTP status codes

### Service-Level Error Handling

Services implement robust error handling through:
- Custom exception types for business logic errors
- Consistent error message formatting
- Proper propagation of errors to calling code

### Transaction Management

Critical operations use database transactions to ensure data consistency:
- Module completion and reward transactions
- Quiz submissions and scoring
- Media upload and association with content

## Testing Strategy

### Unit Tests

Unit tests validate individual components in isolation:
- Service methods with mocked repositories
- Controller methods with mocked services
- Repository methods with test database

### Integration Tests

Integration tests validate interactions between components:
- End-to-end API tests
- Service integrations with actual repositories
- Database schema validation

### E2E Tests

End-to-end tests validate complete user flows:
- Module completion workflow
- Quiz submission and scoring
- Reward calculation and distribution

## Performance Considerations

### Caching Strategy

The game module implements caching to improve performance:

#### Section Content Caching
- **In-Memory Cache**: The `SectionContentService` implements an in-memory cache using a Map to store content with timestamps:
  ```typescript
  private readonly contentCache = new Map<string, { content: SectionContentDto[], timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  ```
- **Cache Invalidation**: The cache is automatically invalidated when content is modified, ensuring data consistency:
  ```typescript
  // Example of cache invalidation on content update
  async updateSectionContent(contentId: string, updateDto: UpdateSectionContentDto): Promise<SectionContentDto> {
    // ...update logic...
    
    // Invalidate cache for this section
    this.contentCache.delete(content.sectionId);
    
    return {
      id: savedContent.id,
      contentType: savedContent.contentType as SectionContentType,
      content: savedContent.content,
      orderIndex: savedContent.orderIndex
    };
  }
  ```
- **Cache Expiration**: Cache entries have a configurable TTL to balance memory usage with performance
- **Manual Cache Control**: An API endpoint allows administrators to manually clear the cache when needed

#### User Progress Data
- Cache frequently accessed user progress data
- Implement Redis for distributed caching in multi-server environments (planned for future)

### Query Optimization

Optimize database queries:
- Eager loading of related entities when needed
- Pagination for large result sets
- Index optimization for frequent queries

### Background Processing

Use background tasks for resource-intensive operations:
- Reward transaction processing
- Notification distribution
- Analytics computation
- Media processing tasks

## Content Management Implementation

### Section Content Service

The content management implementation includes a dedicated `SectionContentService` responsible for:

1. **Content Type Validation**: Validates content structure based on content type (text, image, video, etc.)
   ```typescript
   private validateContent(contentType: string, content: any): void {
     // Validate content structure based on type
     switch (contentType) {
       case SectionContentType.HEADING:
         if (!content.text) {
           throw new BadRequestException('Heading content must include text');
         }
         // ...more validations
         break;
       // ...other content types
     }
   }
   ```

2. **Media Asset Reference Processing**: Validates and processes media references within content
   ```typescript
   private async processMediaReferences(content: any): Promise<any> {
     // Process assetId references
     if (newContent.assetId) {
       const asset = await this.mediaAssetRepository.findOne({ 
         where: { id: newContent.assetId } 
       });
       
       // Add the URL from the media asset
       newContent.url = asset.filePath;
     }
     // ...process nested references
   }
   ```

3. **Progress Tracking**: Associates content consumption with user progress
   ```typescript
   async trackContentInteraction(userId: string, sectionId: string, contentId: string, timeSpent: number): Promise<{ success: boolean }> {
     // Record user interaction with content
   }
   ```

4. **Content Statistics**: Provides analytics on content consumption
   ```typescript
   async getContentProgressStats(userId: string, sectionId: string): Promise<{ total: number; viewed: number; percentage: number }> {
     // Calculate content viewing statistics
   }
   ```
       changeDescription || 'Content updated',
     );
     
     // Update the content
     // ...update logic...
   }
   ```

6. **Template-based Content Creation**: Create content from reusable templates
   ```typescript
   async createSectionContent(
     createDto: CreateSectionContentDto,
     user?: UserEntity,
   ): Promise<SectionContentDto> {
     // Handle template-based content creation
     if (createDto.templateId) {
       createDto.content = await this.contentTemplateService.createContentFromTemplate(
         createDto.templateId,
         createDto.content || {},
       );
     }
     
     // Create content entity
     // ...creation logic...
   }
   ```

## New Content Management Components

### Content Versioning System

The content versioning system enables tracking all changes to content with rollback capabilities:

1. **Version Entity Structure**:
   ```typescript
   @Entity('content_versions')
   export class ContentVersionEntity {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'uuid' })
     contentId: string;
   
     @ManyToOne(() => SectionContentEntity, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'contentId' })
     content: SectionContentEntity;
   
     @Column({ type: 'jsonb' })
     contentData: any;
   
     @Column({ type: 'varchar', length: 255, nullable: true })
     changeDescription: string;
   
     @Column({ type: 'varchar', length: 255 })
     changedBy: string;
   
     @Column({ type: 'int', default: 1 })
     versionNumber: number;
   
     @CreateDateColumn()
     createdAt: Date;
   }
   ```

2. **Version Repository**:
   The ContentVersionRepository provides methods to create and retrieve content versions:
   ```typescript
   async createVersion(contentId, contentData, changedBy, changeDescription): Promise<ContentVersionEntity>
   async getVersionHistory(contentId): Promise<ContentVersionEntity[]>
   async getVersion(versionId): Promise<ContentVersionEntity>
   async getVersionByNumber(contentId, versionNumber): Promise<ContentVersionEntity>
   ```

3. **Rollback Functionality**:
   ```typescript
   async revertToVersion(contentId: string, versionId: string): Promise<SectionContentDto> {
     // Verify content and version exist
     // ...verification logic...
     
     // Create a new version with current content before reverting
     await this.contentVersionRepository.createVersion(
       contentId,
       content.content,
       'system',
       `Auto-saved before reverting to version ${version.versionNumber}`,
     );
     
     // Update content with version data
     const updatedContent = await this.contentRepository.update(contentId, {
       content: version.contentData,
     });
     
     // Invalidate cache for this section
     this.contentCache.delete(content.sectionId);
     
     return this.mapEntityToDto(updatedContent);
   }
   ```

### Content Templates System

The content templates system standardizes content creation with reusable templates:

1. **Template Entity Structure**:
   ```typescript
   @Entity('content_templates')
   export class ContentTemplateEntity {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'varchar', length: 255 })
     name: string;
   
     @Column({ type: 'varchar', length: 100 })
     contentType: string;
     
     @Column({ type: 'text', nullable: true })
     description: string;
   
     @Column({ type: 'jsonb' })
     template: any;
     
     @Column({ type: 'boolean', default: true })
     isActive: boolean;
   
     @Column({ type: 'varchar', length: 255 })
     createdBy: string;
   
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

2. **Template Management**:
   The ContentTemplateService manages templates and provides validation:
   ```typescript
   async getTemplatesByType(contentType): Promise<ContentTemplateEntity[]>
   async getDefaultTemplateForType(contentType): Promise<any>
   async createContentFromTemplate(templateId, overrides): Promise<any>
   validateContentByType(contentType, content): void
   ```

3. **Template Validation Rules**:
   Each content type has specific validation rules defined:
   ```typescript
   private contentValidationRules: Map<SectionContentTypeEnum, ContentValidationRule[]> = new Map([
     [
       SectionContentTypeEnum.HEADING,
       [
         {
           field: 'text',
           validations: [
             { type: 'required', message: 'Heading text is required' },
             { type: 'maxLength', value: 200, message: 'Heading text cannot exceed 200 characters' },
           ],
         },
         // ...more validations...
       ],
     ],
     // ...other content types...
   ]);
   ```

### Advanced Media Processing

The MediaProcessingService provides comprehensive media optimization capabilities:

1. **Image Processing**:
   ```typescript
   async processImage(
     asset: MediaAssetEntity,
     options: Record<string, ImageResizeOptions> = {},
   ): Promise<Record<string, string>> {
     // Process images into multiple formats and sizes
     // ...processing logic...
   }
   
   async generateResponsiveImages(
     asset: MediaAssetEntity,
   ): Promise<Record<string, string>> {
     // Generate responsive images at common breakpoints
     // ...responsive image generation logic...
   }
   ```

2. **Video Transcoding**:
   ```typescript
   async processVideo(
     asset: MediaAssetEntity,
     options: VideoProcessingOptions = {},
   ): Promise<Record<string, string>> {
     // Transcode video into different formats and qualities
     // Generate thumbnails
     // ...video processing logic...
   }
   ```

3. **Audio Processing**:
   ```typescript
   async processAudio(
     asset: MediaAssetEntity,
   ): Promise<Record<string, string>> {
     // Normalize and optimize audio files
     // ...audio processing logic...
   }
   ```

## Admin Dashboard Implementation

The admin dashboard functionality is implemented through dedicated controllers:

### AdminContentController

Provides endpoints for content management and statistics:

1. **Content Statistics**:
   ```typescript
   @Get('statistics')
   async getContentStatistics(): Promise<ContentStatisticsDto> {
     return this.contentService.getContentStatistics();
   }
   ```

2. **Bulk Operations**:
   ```typescript
   @Post('bulk/import')
   async bulkImportContent(@Body() { items }: BulkContentOperationDto): Promise<BulkOperationResultDto> {
     return this.contentService.bulkImportContent(items);
   }
   
   @Post('bulk/export')
   async bulkExportContent(
     @Query('sectionId') sectionId?: string,
     @Query('moduleId') moduleId?: string,
   ): Promise<BulkExportResultDto> {
     return this.contentService.bulkExportContent(sectionId, moduleId);
   }
   ```

3. **Cache Management**:
   ```typescript
   @Post('cache/clear')
   async clearContentCache(
     @Query('sectionId') sectionId?: string,
   ): Promise<{ success: boolean; message: string }> {
     return this.contentService.clearCache(sectionId);
   }
   ```

## User Progress Tracking Implementation

The user progress tracking system has been enhanced to support:

1. **Content-Level Progress**: Track individual content items viewed
   ```typescript
   async getSectionContentWithProgress(userId: string, sectionId: string): Promise<Array<SectionContentDto & { viewed: boolean }>> {
     // Return content with viewed status indicators
   }
   ```

2. **Time Tracking**: Record time spent on different content
   ```typescript
   // In CheckpointCompletionDto
   timeSpent?: number; // Time spent in seconds
   ```

3. **Section Completion Statistics**: Calculate percentage completion for sections
   ```typescript
   const total = contentWithProgress.length;
   const viewed = contentWithProgress.filter(item => item.viewed).length;
   const percentage = total > 0 ? Math.floor((viewed / total) * 100) : 0;
   ```

4. **Checkpoint System**: Enhanced checkpoint data model with content type reference
   ```typescript
   // In CheckpointCompletionDto
   checkpointType?: string; // e.g., 'content-text', 'content-image'
   contentId?: string;     // Reference to specific content
   ```

## Security Measures

### Authentication

Secure all endpoints through:
- JWT authentication
- Role-based access control
- Module access verification

### Data Validation

Validate all incoming data through:
- DTO validation decorators
- Input sanitization
- Data format verification

### Rate Limiting

Implement rate limiting for sensitive operations:
- Quiz submissions
- Reward claims
- Media uploads

## Future Architecture Extensions

### Analytics Integration

Future integration with analytics system to:
- Track user learning patterns
- Optimize module content
- Identify completion bottlenecks

### Recommendation Engine

Potential integration with a recommendation engine to:
- Suggest relevant modules to users
- Personalize learning paths
- Optimize user engagement

### Content Approval Workflow

The content approval workflow provides a structured process for content creation, review, and publishing:

### Content Approval Entity Structure

```typescript
@Entity('content_approvals')
export class ContentApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => SectionContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: SectionContent;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.DRAFT
  })
  status: ApprovalStatus;

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submitter: User;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId: string;

  // ...other fields...
}
```

### Approval Workflow Stages

The content approval workflow includes multiple stages:

1. **Draft Stage**: 
   - Content is created in draft state
   - Multiple updates can be made before submission
   - Content versions are tracked for history

2. **Review Stage**:
   - Content is submitted for review
   - Reviewers can add comments and feedback
   - Approval decisions are tracked with timestamps

3. **Approval Stage**:
   - Content is approved for publishing
   - Optional scheduling for future publishing
   - Final content validation checks

4. **Publishing Stage**:
   - Content is published for users
   - Scheduled publishing via background tasks
   - Content becomes visible in learning modules

5. **Rejection Handling**:
   - Content can be rejected with feedback
   - Authors can revise and resubmit
   - Full history of rejection reasons is maintained

### Approval Service Implementation

The ContentApprovalService orchestrates the approval workflow:

```typescript
async submitForReview(submitDto: SubmitForReviewDto, userId: string): Promise<ContentApproval> {
  // Create approval record in IN_REVIEW status
  // Add optional submission comments
  // Validate content before submission
}

async reviewContent(approvalId: string, reviewDto: ReviewDecisionDto, reviewerId: string): Promise<ContentApproval> {
  // Update approval with decision
  // Handle scheduling for approved content
  // Record rejection reasons
}

async publishContent(approvalId: string, userId: string): Promise<ContentApproval> {
  // Mark content as published
  // Update section content status
  // Trigger notifications if needed
}
```

## Collaboration Features

The collaboration system enables team-based content creation through structured feedback:

### Collaboration Comment Entity Structure

```typescript
@Entity('collaboration_comments')
export class CollaborationComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id' })
  contentId: string;

  @ManyToOne(() => SectionContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: SectionContent;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ name: 'comment_type', default: 'feedback' })
  commentType: 'feedback' | 'question' | 'suggestion' | 'resolution';

  // ...other fields...
}
```

### Collaboration Features

1. **Feedback System**:
   - Comments can be added to specific content
   - Different comment types (feedback, question, suggestion)
   - Comments can be marked as resolved

2. **Threaded Comments**:
   - Support for reply chains on comments
   - Parent-child relationship between comments
   - Full conversation threads for complex discussions

3. **Context Data**:
   - Optional JSON context data for comments
   - Can reference specific parts of content (e.g., paragraph, timestamp)
   - Supports different visualization needs

4. **Resolution Workflow**:
   - Comments can be resolved with attribution
   - Resolution timestamp and resolver tracking
   - Filter by resolved/unresolved comments

### Integration with Content Approval

The collaboration system integrates with the approval workflow:

1. **Review Comments**:
   - Reviewers can add feedback during review stage
   - Authors receive notifications about new comments
   - Content approval can be conditional on comment resolution

2. **Comment Statistics**:
   - Dashboard shows unresolved comment counts
   - Comment metrics by content item and section
   - Activity tracking for collaboration

3. **Revision Cycle**:
   - Comments drive content revisions
   - Comment history provides audit trail
   - Comment resolution statuses affect approval recommendations

## Admin Dashboard Extensions

The admin dashboard includes dedicated views for the approval workflow:

1. **Approval Dashboard**:
   - Overview of content approval statuses
   - Filterable lists by status, creator, and reviewer
   - Batch operations for approval processes

2. **Workflow Analytics**:
   - Content approval time metrics
   - Review cycle statistics
   - Reviewer workload distribution

3. **Content Quality Metrics**:
   - Rejection rate statistics
   - Common feedback themes
   - Revision cycle metrics

## Extended Module Structure

With the content approval and collaboration features, the module structure now includes:

```
backend/
└── src/
    └── game/
        ├── controllers/
        │   ├── content-approval.controller.ts   # Content approval workflow endpoints
        │   └── collaboration-comment.controller.ts # Collaboration feature endpoints
        ├── services/
        │   ├── content-approval.service.ts      # Content approval workflow logic
        │   └── collaboration-comment.service.ts # Collaboration feature logic
        ├── dto/
        │   ├── content-approval.dto.ts          # Content approval DTOs
        │   └── collaboration-comment.dto.ts     # Collaboration comment DTOs
        ├── entities/
        │   ├── content-approval.entity.ts       # Content approval entity
        │   └── collaboration-comment.entity.ts  # Collaboration comment entity
        └── repositories/
            ├── content-approval.repository.ts   # Content approval data access
            └── collaboration-comment.repository.ts # Collaboration comment data access
```

This architecture provides a comprehensive system for content management with proper review processes, quality control, and team collaboration capabilities.

## Quiz System Architecture

The quiz system provides a comprehensive framework for creating, managing, and evaluating interactive quizzes within the learning experience. The system supports various question types, scoring mechanisms, and detailed analytics.

### Quiz Entities

The quiz system is structured around four main entities:

1. **Quiz Entity** (`quiz.entity.ts`): Defines the overall quiz configuration
   ```typescript
   @Entity('quizzes')
   export class Quiz {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'varchar', length: 255 })
     title: string;
   
     @Column({ type: 'text', nullable: true })
     description: string;
   
     // Module and section relationships
     @Column({ nullable: true })
     moduleId: string;
   
     @ManyToOne(() => GameModule, { nullable: true })
     @JoinColumn({ name: 'moduleId' })
     module: GameModule;
   
     @Column({ nullable: true })
     sectionId: string;
   
     @ManyToOne(() => GameSection, { nullable: true })
     @JoinColumn({ name: 'sectionId' })
     section: GameSection;
   
     // Configuration fields
     @Column({ type: 'int', default: 0 })
     passingScore: number;
   
     @Column({ type: 'int', default: 0 })
     totalPoints: number;
   
     @Column({ type: 'int', default: 60 })
     timeLimit: number; // Time limit in seconds
   
     @Column({ type: 'enum', enum: QuizDifficultyEnum, default: QuizDifficultyEnum.MEDIUM })
     difficulty: QuizDifficultyEnum;
   
     @Column({ type: 'jsonb', nullable: true })
     resultThresholds: {
       excellent: number;
       good: number;
       pass: number;
     };
   
     // Quiz behavior settings
     @Column({ type: 'boolean', default: true })
     showCorrectAnswers: boolean;
   
     @Column({ type: 'boolean', default: false })
     randomizeQuestions: boolean;
   
     @Column({ type: 'boolean', default: true })
     isActive: boolean;
   
     @Column({ type: 'int', default: 1 })
     maxAttempts: number;
   
     // Relationships
     @OneToMany(() => QuizQuestion, question => question.quiz)
     questions: QuizQuestion[];
   
     // Timestamps
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   
     @Column({ nullable: true })
     createdBy: string;
   }
   ```

2. **Quiz Question Entity** (`quiz-question.entity.ts`): Defines individual quiz questions
   ```typescript
   @Entity('quiz_questions')
   export class QuizQuestion {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'uuid' })
     quizId: string;
   
     @ManyToOne(() => Quiz, quiz => quiz.questions, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'quizId' })
     quiz: Quiz;
   
     @Column({ type: 'varchar', length: 500 })
     text: string;
   
     @Column({ type: 'enum', enum: QuestionTypeEnum, default: QuestionTypeEnum.SINGLE_CHOICE })
     type: QuestionTypeEnum;
   
     @Column({ type: 'int', default: 1 })
     points: number;
   
     @Column({ type: 'jsonb', nullable: true })
     options: any[]; // Stores options for multiple choice, match pairs, etc.
   
     @Column({ type: 'jsonb', nullable: true })
     correctAnswer: any; // Format depends on question type
   
     @Column({ type: 'text', nullable: true })
     explanation: string;
   
     @Column({ type: 'varchar', nullable: true })
     imageUrl: string;
   
     @Column({ type: 'int' })
     orderIndex: number;
   
     @Column({ type: 'jsonb', nullable: true })
     feedback: {
       correctFeedback?: string;
       incorrectFeedback?: string;
       partialFeedback?: string;
     };
   
     @Column({ type: 'int', nullable: true })
     timeLimit: number; // Individual time limit in seconds
   
     @Column({ type: 'boolean', default: true })
     isActive: boolean;
     
     @Column({ type: 'jsonb', nullable: true })
     metadata: Record<string, any>; // For extended question type data
     
     // Timestamps
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

3. **Quiz Session Entity** (`quiz-session.entity.ts`): Tracks user quiz attempts
   ```typescript
   @Entity('quiz_sessions')
   export class QuizSession {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'uuid' })
     quizId: string;
   
     @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'quizId' })
     quiz: Quiz;
   
     @Column({ type: 'uuid' })
     userId: string;
   
     @Column({ type: 'enum', enum: QuizSessionStatus, default: QuizSessionStatus.STARTED })
     status: QuizSessionStatus;
   
     @Column({ type: 'timestamp' })
     startTime: Date;
   
     @Column({ type: 'timestamp', nullable: true })
     endTime: Date;
   
     @Column({ type: 'int', default: 0 })
     score: number;
   
     @Column({ type: 'float', default: 0 })
     percentageScore: number;
   
     @Column({ type: 'enum', enum: QuizAttemptResultStatus, nullable: true })
     resultStatus: QuizAttemptResultStatus;
   
     @Column({ type: 'int', default: 1 })
     attemptNumber: number;
   
     @Column({ type: 'int', default: 0 })
     questionsAnswered: number;
   
     @Column({ type: 'int', default: 0 })
     questionsCorrect: number;
   
     @Column({ type: 'int', default: 0 })
     totalTimeSpent: number; // In seconds
   
     @Column({ type: 'jsonb', nullable: true })
     questionOrder: string[]; // For randomized quizzes
   
     @Column({ type: 'boolean', default: false })
     isPassed: boolean;
   
     @Column({ type: 'text', nullable: true })
     feedback: string; // General feedback for the entire attempt
   
     @OneToMany(() => UserQuizResponse, response => response.quizSession)
     responses: UserQuizResponse[];
   
     // Timestamps
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

4. **User Quiz Response Entity** (`user-quiz-response.entity.ts`): Records individual question responses
   ```typescript
   @Entity('user_quiz_responses')
   export class UserQuizResponse {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column({ type: 'uuid' })
     quizSessionId: string;
   
     @ManyToOne(() => QuizSession, session => session.responses, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'quizSessionId' })
     quizSession: QuizSession;
   
     @Column({ type: 'uuid' })
     questionId: string;
   
     @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'questionId' })
     question: QuizQuestion;
   
     @Column({ type: 'jsonb' })
     userAnswer: any; // User's response data
   
     @Column({ type: 'boolean' })
     isCorrect: boolean;
   
     @Column({ type: 'int', default: 0 })
     earnedPoints: number;
   
     @Column({ type: 'float', default: 0 })
     completionPercentage: number; // For partially correct answers
   
     @Column({ type: 'int', default: 0 })
     timeSpent: number; // Time spent on this question in seconds
   
     @Column({ type: 'timestamp' })
     answeredAt: Date;
   
     @Column({ type: 'text', nullable: true })
     feedback: string; // Specific feedback for this response
   
     // Timestamps
     @CreateDateColumn()
     createdAt: Date;
   
     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

### Question Types

The quiz system supports multiple question types as defined in the `QuestionTypeEnum`:

```typescript
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
```

Each question type has specific structures for options, correct answers, and scoring logic.

### Quiz Difficulty Levels

Quizzes are categorized by difficulty level:

```typescript
export enum QuizDifficultyEnum {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}
```

### Quiz Session Status

Quiz sessions track progress through different states:

```typescript
export enum QuizSessionStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired'
}
```

### Quiz Result Evaluation

Results are categorized based on configured thresholds:

```typescript
export enum QuizAttemptResultStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  PASS = 'pass',
  FAIL = 'fail'
}
```

### Quiz Service Implementation

The QuizService provides comprehensive quiz management capabilities:

```typescript
export class QuizService {
  // Quiz creation and management
  async createQuiz(createDto: CreateQuizDto): Promise<QuizDto>
  async updateQuiz(quizId: string, updateDto: UpdateQuizDto): Promise<QuizDto>
  async getQuiz(quizId: string): Promise<QuizDto>
  async listQuizzesByModule(moduleId: string): Promise<QuizListDto>
  async listQuizzesBySection(sectionId: string): Promise<QuizListDto>
  
  // Question management
  async addQuestion(quizId: string, questionDto: CreateQuizQuestionDto): Promise<QuizQuestionDto>
  async updateQuestion(questionId: string, updateDto: UpdateQuizQuestionDto): Promise<QuizQuestionDto>
  async deleteQuestion(questionId: string): Promise<void>
  
  // Quiz session management
  async startQuizSession(userId: string, quizId: string): Promise<QuizSessionDto>
  async submitQuizAnswer(sessionId: string, answerDto: SubmitAnswerDto): Promise<AnswerResponseDto>
  async completeQuizSession(sessionId: string): Promise<QuizResultDto>
  
  // Analytics and reporting
  async getUserQuizHistory(userId: string, filters?: QuizHistoryFilterDto): Promise<QuizHistoryDto>
  async getQuizStatistics(quizId: string): Promise<QuizStatisticsDto>
  async getQuestionStatistics(questionId: string): Promise<QuestionStatisticsDto>
}
```

### Quiz Repositories

The quiz system includes specialized repositories:

```typescript
// Quiz Repository
export class QuizRepository {
  async findByModule(moduleId: string): Promise<Quiz[]>
  async findBySection(sectionId: string): Promise<Quiz[]>
  async findWithQuestions(quizId: string): Promise<Quiz>
  async countAttempts(userId: string, quizId: string): Promise<number>
}

// Quiz Question Repository
export class QuizQuestionRepository {
  async findByQuiz(quizId: string): Promise<QuizQuestion[]>
  async bulkCreate(quizId: string, questions: CreateQuizQuestionDto[]): Promise<QuizQuestion[]>
  async getQuestionStatistics(questionId: string): Promise<QuestionStatisticsDto>
}

// Quiz Session Repository
export class QuizSessionRepository {
  async createSession(userId: string, quizId: string, attemptNumber: number): Promise<QuizSession>
  async findActiveSessions(userId: string): Promise<QuizSession[]>
  async markAsCompleted(sessionId: string, score: number, isPassed: boolean): Promise<QuizSession>
}

// User Quiz Response Repository
export class UserQuizResponseRepository {
  async saveResponse(responseData: CreateResponseDto): Promise<UserQuizResponse>
  async getSessionResponses(sessionId: string): Promise<UserQuizResponse[]>
  async getResponsesForQuestion(questionId: string): Promise<UserQuizResponse[]>
}
```

### Integration with Learning Modules

The quiz system integrates with game modules and sections:

1. **Module Integration**:
   - Quizzes can be associated with specific modules
   - Module completion may require passing associated quizzes

2. **Section Integration**:
   - Quizzes can be linked to specific sections
   - Section checkpoints track quiz completion

3. **Progress Integration**:
   - Quiz completion contributes to overall user progress
   - Quiz performance affects user rewards and achievements
   - Performance analytics feed into learning effectiveness metrics

### Quiz Analytics System

The quiz system provides comprehensive analytics:

1. **User-Level Analytics**:
   - Quiz completion rates
   - Performance trends over time
   - Strength and weakness identification

2. **Question-Level Analytics**:
   - Difficulty assessment based on user performance
   - Time spent per question type
   - Common incorrect answers

3. **Educational Effectiveness**:
   - Content area mastery indicators
   - Learning outcome achievement metrics
   - Intervention recommendation for struggling areas

This quiz system architecture enables rich interactive assessment experiences within the learning platform, supporting diverse question types and providing detailed analytics to enhance the educational experience.