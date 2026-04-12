import { Entity, Property, Enum, ManyToOne, ManyToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { NotificationTemplate } from './notification-template.entity';
import { UserGroup } from '../../iam/entities/user-group.entity';

/**
 * Event that fires a scheduled notification.
 *
 * A cron job (or event listener) evaluates active triggers and sends
 * the templated notification to target groups / users when the
 * condition is met — e.g. "7 days before purchase order delivery date".
 */
export enum TriggerEvent {
  SHIPMENT_ETA_MINUS_X = 'SHIPMENT_ETA_MINUS_X',
  PO_DELIVERY_DATE_MINUS_X = 'PO_DELIVERY_DATE_MINUS_X',
  INVOICE_OVERDUE_X = 'INVOICE_OVERDUE_X',
  PRODUCTION_MILESTONE_OVERDUE = 'PRODUCTION_MILESTONE_OVERDUE',
  SAMPLE_RETURN_OVERDUE = 'SAMPLE_RETURN_OVERDUE',
  INVENTORY_COUNT_DUE = 'INVENTORY_COUNT_DUE',
}

/**
 * Scheduled Notification Trigger
 *
 * Defines a rule that generates notifications automatically: "send the
 * SHIPMENT_ETA_WARNING template to the logistics team 7 days before
 * the shipment's estimated arrival". The notification engine evaluates
 * every active trigger once per scheduling interval.
 */
@Entity({ tableName: 'scheduled_notification_triggers' })
export class ScheduledNotificationTrigger extends BaseTenantEntity {
  @ManyToOne(() => NotificationTemplate)
  @Index()
  template!: NotificationTemplate;

  @Enum(() => TriggerEvent)
  event!: TriggerEvent;

  /** Number of days before the event date the notification should fire. */
  @Property()
  daysBefore!: number; // e.g. 7, 3, 1

  /** Groups that should receive the notification when it fires. */
  @ManyToMany(() => UserGroup)
  targetGroups = new Collection<UserGroup>(this);

  /** Optional explicit user IDs (override when groups are too broad). */
  @Property({ type: 'jsonb', nullable: true })
  targetUserIds?: string[];

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
