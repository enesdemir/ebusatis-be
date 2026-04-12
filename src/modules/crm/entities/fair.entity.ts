import {
  Entity,
  Property,
  OneToMany,
  Collection,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export enum FairStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Fair (Fuar) — trade-show calendar entry (Sprint 12).
 *
 * Tracks events our sales team attends, a participant list (contacts
 * met at the booth), and the leads generated from each fair.
 */
@Entity({ tableName: 'fairs' })
export class Fair extends BaseTenantEntity {
  @Property()
  @Index()
  name!: string;

  @Property({ nullable: true })
  venue?: string;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
  country?: string;

  @Property({ type: 'date' })
  startDate!: Date;

  @Property({ type: 'date' })
  endDate!: Date;

  @Enum(() => FairStatus)
  status: FairStatus = FairStatus.PLANNED;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Property({ nullable: true, type: 'decimal', precision: 14, scale: 2 })
  budget?: number;

  @Property({ nullable: true })
  currency?: string;

  @OneToMany('FairParticipant', 'fair')
  participants = new Collection<object>(this);

  @OneToMany('Lead', 'fair')
  leads = new Collection<object>(this);
}
