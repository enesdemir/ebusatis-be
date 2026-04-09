import { Module, Global } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';

/**
 * Global modul — NotificationService tum diger modullerden erisilebilir.
 * Diger servisler bildirim olusturmak icin inject edebilir.
 */
@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
