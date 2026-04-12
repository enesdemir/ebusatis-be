import { Module, Global } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { ScheduledNotificationTrigger } from './entities/scheduled-notification-trigger.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';

/**
 * Notifications module (global).
 *
 * Global so that any service in the application can inject
 * `NotificationService` to send notifications without importing this
 * module explicitly.
 *
 * Stage 0.C additions: NotificationTemplate and
 * ScheduledNotificationTrigger entities for the scheduled notification
 * pipeline.
 */
@Global()
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      ScheduledNotificationTrigger,
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
