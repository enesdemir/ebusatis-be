import { Module, Global } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { ScheduledNotificationTrigger } from './entities/scheduled-notification-trigger.entity';
import { NotificationRoutingConfig } from './entities/notification-routing-config.entity';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { Invoice } from '../finance/entities/invoice.entity';
import { ApprovalRequest } from '../approvals/entities/approval-request.entity';
import { NotificationService } from './services/notification.service';
import { NotificationRoutingService } from './services/notification-routing.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { ScheduledTasksService } from './services/scheduled-tasks.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationRoutingController } from './controllers/notification-routing.controller';
import { ScheduledTasksController } from './controllers/scheduled-tasks.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Notifications module (global) — Sprint 9.
 *
 * Adds Email/SMS dispatch utilities, the routing-config matrix, the
 * cron-driven scheduled-tasks service and a dev-only manual trigger
 * controller on top of the existing in-app notification CRUD.
 *
 * `@Global()` so any service in the app can inject the dispatch
 * services without re-importing this module.
 */
@Global()
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      ScheduledNotificationTrigger,
      NotificationRoutingConfig,
      PurchaseOrder,
      Invoice,
      ApprovalRequest,
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [
    NotificationController,
    NotificationRoutingController,
    ScheduledTasksController,
  ],
  providers: [
    NotificationService,
    NotificationRoutingService,
    EmailService,
    SmsService,
    ScheduledTasksService,
  ],
  exports: [
    NotificationService,
    NotificationRoutingService,
    EmailService,
    SmsService,
  ],
})
export class NotificationsModule {}
