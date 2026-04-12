import { Entity, Property, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { UserGroup } from '../../iam/entities/user-group.entity';

/**
 * Channels through which a notification can be delivered.
 *
 * Flagged as a JSONB array on `Notification.channels` and on
 * `NotificationRoutingConfig.channels` so a single event can fan out
 * to in-app + email + SMS at the same time.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

/**
 * Notification Routing Config
 *
 * Tenant-tunable matrix mapping a trigger event (string code) to a
 * recipient group + channel combo. The cron jobs and ad-hoc service
 * calls look up rows where `eventCode` matches and dispatch one
 * notification per (channel, group) pair.
 *
 * Multi-tenant: extends BaseTenantEntity. A given event can have
 * multiple rows (e.g. `INVOICE_DUE` → finance via email +
 * management via in-app).
 */
@Entity({ tableName: 'notification_routing_configs' })
export class NotificationRoutingConfig extends BaseTenantEntity {
  /**
   * Stable event code emitted by services (`PO_DELIVERY_WARNING`,
   * `INVOICE_DUE`, `PAYMENT_RECEIVED`, `APPROVAL_PENDING`, …).
   */
  @Property()
  @Index()
  eventCode!: string;

  @ManyToOne(() => UserGroup, { nullable: true })
  recipientGroup?: UserGroup;

  /**
   * Channels to fire for this row, stored as a JSONB array of
   * `NotificationChannel` codes.
   */
  @Enum({ items: () => NotificationChannel, array: true })
  channels: NotificationChannel[] = [NotificationChannel.IN_APP];

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'text' })
  description?: string;
}
