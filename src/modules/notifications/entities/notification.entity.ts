import { Entity, Property, ManyToOne, Index, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { NotificationTemplate } from './notification-template.entity';
import { UserGroup } from '../../iam/entities/user-group.entity';

export enum NotificationType {
  ORDER = 'ORDER',
  INVENTORY = 'INVENTORY',
  FINANCE = 'FINANCE',
  PRODUCTION = 'PRODUCTION',
  LOGISTICS = 'LOGISTICS',
  SYSTEM = 'SYSTEM',
}

export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Notification
 *
 * A single notification delivered to a user. Can be created ad-hoc by
 * any service or generated automatically by a ScheduledNotificationTrigger.
 *
 * Stage 0.C additions: `scheduledAt`, `triggerEvent`, `template` FK and
 * `targetGroup` FK to support the scheduled notification pipeline.
 */
@Entity({ tableName: 'notifications' })
@Index({
  properties: ['recipient', 'isRead'],
  name: 'idx_notification_recipient_read',
})
@Index({
  properties: ['tenant', 'createdAt'],
  name: 'idx_notification_tenant_date',
})
export class Notification extends BaseEntity {
  @ManyToOne(() => Tenant)
  tenant!: Tenant;

  @ManyToOne(() => User)
  recipient!: User;

  @Enum(() => NotificationType)
  type!: NotificationType;

  @Enum(() => NotificationSeverity)
  severity: NotificationSeverity = NotificationSeverity.INFO;

  @Property()
  title!: string;

  @Property({ type: 'text' })
  message!: string;

  @Property({ nullable: true, length: 50 })
  icon?: string;

  @Property({ nullable: true })
  actionUrl?: string;

  @Property({ nullable: true, length: 50 })
  referenceType?: string;

  @Property({ nullable: true })
  referenceId?: string;

  @Property({ default: false })
  isRead: boolean = false;

  @Property({ nullable: true, type: 'datetime' })
  readAt?: Date;

  // ── Scheduling fields (stage 0.C) ──

  /** When this notification should be delivered. Null = immediate. */
  @Property({ nullable: true, type: 'datetime' })
  scheduledAt?: Date;

  /** Trigger event that generated this notification (if scheduled). */
  @Property({ nullable: true })
  triggerEvent?: string;

  /** Template used to generate this notification (if templated). */
  @ManyToOne(() => NotificationTemplate, { nullable: true })
  template?: NotificationTemplate;

  /** User group this notification was targeted at (for analytics). */
  @ManyToOne(() => UserGroup, { nullable: true })
  targetGroup?: UserGroup;
}
