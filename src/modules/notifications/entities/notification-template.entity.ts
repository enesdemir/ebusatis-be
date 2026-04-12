import { Entity, Property, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { NotificationType, NotificationSeverity } from './notification.entity';

/**
 * Notification Template
 *
 * Defines the shape and defaults of a notification that can be sent
 * manually or triggered automatically by a ScheduledNotificationTrigger.
 * The `titleI18nKey` and `bodyI18nKey` allow the frontend to render
 * the notification in the user's locale.
 */
@Entity({ tableName: 'notification_templates' })
export class NotificationTemplate extends BaseTenantEntity {
  /** Stable template identifier, e.g. "shipment_eta_warning". */
  @Property()
  @Index()
  code!: string; // tenant-unique

  @Property()
  titleI18nKey!: string; // e.g. "notifications.shipment_eta.title"

  @Property()
  bodyI18nKey!: string; // e.g. "notifications.shipment_eta.body"

  @Enum(() => NotificationType)
  type!: NotificationType;

  @Enum(() => NotificationSeverity)
  defaultSeverity: NotificationSeverity = NotificationSeverity.INFO;

  @Property({ default: true })
  isActive: boolean = true;
}
