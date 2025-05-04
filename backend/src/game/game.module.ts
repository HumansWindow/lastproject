import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { GameModulesController } from './controllers/game-modules.controller';
import { GameSectionsController } from './controllers/game-sections.controller';
import { UserProgressController } from './controllers/user-progress.controller';
import { QuizController } from './controllers/quiz.controller';
import { MediaController } from './controllers/media.controller';
import { RewardsController } from './controllers/rewards.controller';
import { AdminContentController } from './controllers/admin-content.controller';
import { ContentTemplateController } from './controllers/content-template.controller';
import { ContentApprovalController } from './controllers/content-approval.controller';
import { CollaborationCommentController } from './controllers/collaboration-comment.controller';
import { GameNotificationController } from './controllers/game-notification.controller';

// Gateways
import { GameWebSocketGateway } from './gateways/game-websocket.gateway';
import { GameNotificationGateway } from './gateways/game-notification.gateway';

// Services
import { GameModulesService } from './services/game-modules.service';
import { GameSectionsService } from './services/game-sections.service';
import { UserProgressService } from './services/user-progress.service';
import { SectionContentService } from './services/section-content.service';
import { QuizService } from './services/quiz.service';
import { MediaService } from './services/media.service';
import { MediaProcessingService } from './services/media-processing.service';
import { RewardsService } from './services/rewards.service';
import { GameNotificationService } from './services/game-notification.service'; // Fixed import name (singular)
import { ContentTemplateService } from './services/content-template.service';
import { ContentApprovalService } from './services/content-approval.service';
import { CollaborationCommentService } from './services/collaboration-comment.service';

// Repositories
import { GameModuleRepository } from './repositories/game-module.repository';
import { GameSectionRepository } from './repositories/game-section.repository';
import { UserProgressRepository } from './repositories/user-progress.repository';
import { SectionContentRepository } from './repositories/section-content.repository';
import { MediaAssetRepository } from './repositories/media-asset.repository';
import { QuizRepository } from './repositories/quiz.repository.js';
import { ContentVersionRepository } from './repositories/content-version.repository';
import { ContentTemplateRepository } from './repositories/content-template.repository';
import { ContentApprovalRepository } from './repositories/content-approval.repository';
import { CollaborationCommentRepository } from './repositories/collaboration-comment.repository';

// Entities
import { GameModule as GameModuleEntity } from './entities/game-module.entity';
import { GameSection } from './entities/game-section.entity';
import { SectionContent } from './entities/section-content.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SectionCheckpoint } from './entities/section-checkpoint.entity';
import { MediaAssetEntity } from './entities/media-asset.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizResponse } from './entities/quiz-response.entity';
import { ContentVersionEntity } from './entities/content-version.entity';
import { ContentTemplateEntity } from './entities/content-template.entity';
import { ContentApproval } from './entities/content-approval.entity';
import { CollaborationComment } from './entities/collaboration-comment.entity';
import { GameNotificationTemplate } from './entities/game-notification-template.entity';
import { UserNotification } from './entities/user-notification.entity';
import { ModuleNotificationSchedule } from './entities/module-notification-schedule.entity';

// External modules
import { UsersModule } from '../users/users.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameModuleEntity,
      GameSection,
      SectionContent,
      UserProgress,
      SectionCheckpoint,
      MediaAssetEntity,
      QuizQuestion,
      QuizResponse,
      ContentVersionEntity,
      ContentTemplateEntity,
      ContentApproval,
      CollaborationComment,
      GameNotificationTemplate,
      UserNotification,
      ModuleNotificationSchedule,
    ]),
    UsersModule,
    BlockchainModule,
    SharedModule,
  ],
  controllers: [
    GameModulesController,
    GameSectionsController,
    UserProgressController,
    QuizController,
    MediaController,
    RewardsController,
    AdminContentController,
    ContentTemplateController,
    ContentApprovalController,
    CollaborationCommentController,
    GameNotificationController,
  ],
  providers: [
    // Services
    GameModulesService,
    GameSectionsService,
    UserProgressService,
    SectionContentService,
    QuizService,
    MediaService,
    MediaProcessingService,
    RewardsService,
    GameNotificationService,
    ContentTemplateService,
    ContentApprovalService,
    CollaborationCommentService,
    
    // Gateways
    GameWebSocketGateway,
    GameNotificationGateway,
    
    // Repositories
    GameModuleRepository,
    GameSectionRepository,
    UserProgressRepository,
    SectionContentRepository,
    MediaAssetRepository,
    QuizRepository,
    ContentVersionRepository,
    ContentTemplateRepository,
    ContentApprovalRepository,
    CollaborationCommentRepository,
  ],
  exports: [
    GameModulesService,
    GameSectionsService,
    UserProgressService,
    SectionContentService,
    QuizService,
    MediaService,
    ContentApprovalService,
    CollaborationCommentService,
    GameNotificationService,
  ],
})
export class GameModule {}