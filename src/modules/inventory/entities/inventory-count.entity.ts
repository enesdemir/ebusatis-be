import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';

/** Type of inventory count. */
export enum CountType {
  CYCLE = 'CYCLE',
  ANNUAL = 'ANNUAL',
  SPOT = 'SPOT',
  INITIAL = 'INITIAL',
}

/** Lifecycle status of an inventory count session. */
export enum CountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RECONCILED = 'RECONCILED',
}

/**
 * Inventory Count
 *
 * A periodic or ad-hoc stock-taking session at a specific warehouse.
 * Each count produces a set of `InventoryCountLine` rows that capture
 * the expected-vs-actual variance for every item counted. The
 * RECONCILED status indicates that variances have been reviewed and
 * the corresponding inventory adjustments have been made.
 */
@Entity({ tableName: 'inventory_counts' })
export class InventoryCount extends BaseTenantEntity {
  @Property()
  @Index()
  countNumber!: string; // e.g. "CNT-2026-0001"

  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  @Enum(() => CountType)
  type: CountType = CountType.CYCLE;

  @Enum(() => CountStatus)
  status: CountStatus = CountStatus.DRAFT;

  @Property({ nullable: true, type: 'datetime' })
  startedAt?: Date;

  @Property({ nullable: true, type: 'datetime' })
  completedAt?: Date;

  @ManyToOne(() => User)
  createdBy!: User;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @OneToMany('InventoryCountLine', 'count')
  lines = new Collection<any>(this);
}
