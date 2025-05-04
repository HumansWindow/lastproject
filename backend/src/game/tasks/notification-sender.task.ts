import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameNotificationService } from '../services/game-notification.service';

@Injectable()
export class NotificationSenderTask {
  private readonly logger = new Logger(NotificationSenderTask.name);

  constructor(private readonly notificationService: GameNotificationService) {}

  @Cron('0 */10 * * * *') // Run every 10 minutes
  async handleCron() {
    this.logger.log('Running scheduled notification sender task');
    try {
      const sentCount = await this.notificationService.processScheduledNotifications();
      this.logger.log(`Processed ${sentCount} notifications`);
    } catch (error) {
      this.logger.error('Error processing scheduled notifications', error);
    }
  }
}