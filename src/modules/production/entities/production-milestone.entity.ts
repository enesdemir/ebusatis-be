import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductionOrder } from './production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

/**
 * Üretim Aşaması (Milestone).
 * Tekstil üretim hattı: İplik → Dokuma → Boyama → Apre → Kalite Kontrol
 */
@Entity({ tableName: 'production_milestones' })
export class ProductionMilestone extends BaseTenantEntity {
  @ManyToOne(() => ProductionOrder)
  productionOrder!: ProductionOrder;

  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string;

  @Enum(() => MilestoneStatus)
  status: MilestoneStatus = MilestoneStatus.PENDING;

  @Property()
  sortOrder: number = 0;

  @Property({ nullable: true, type: 'datetime' })
  startedAt?: Date;

  @Property({ nullable: true, type: 'datetime' })
  completedAt?: Date;

  @Property({ nullable: true })
  note?: string;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number = 0;
}
