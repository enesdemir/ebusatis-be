import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SupplierProductionOrder } from './supplier-production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

/**
 * Standard textile production milestone codes.
 *
 * When a SupplierProductionOrder is created, a milestone collection is
 * seeded from this template. The supplier reports progress against each
 * milestone via the supplier-report endpoint.
 */
export enum StandardMilestoneCode {
  DYEHOUSE = 'DYEHOUSE',
  WEAVING = 'WEAVING',
  FINISHING = 'FINISHING',
  QC = 'QC',
  PACKAGING = 'PACKAGING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
}

/**
 * Production Milestone
 *
 * A single stage in the supplier production pipeline. Reportable by the
 * supplier (via `reportedBySupplierAt` and `supplierMediaUrls`).
 *
 * `assignedTo` is optional because tracking an in-house coordinator is
 * not required for supplier production — set it only when an internal
 * owner needs to follow up on this stage.
 */
@Entity({ tableName: 'production_milestones' })
export class ProductionMilestone extends BaseTenantEntity {
  @ManyToOne(() => SupplierProductionOrder)
  @Index()
  productionOrder!: SupplierProductionOrder;

  /**
   * Display name. Stored as an i18n key (e.g. `milestones.dyehouse`)
   * so that the frontend can localize it. The service layer never
   * writes raw TR/EN strings here.
   */
  @Property()
  name!: string;

  /** One of `StandardMilestoneCode` for template-generated milestones. */
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

  // ── Supplier-reporting fields ──

  /** Last time the supplier reported on this milestone. */
  @Property({ nullable: true, type: 'datetime' })
  reportedBySupplierAt?: Date;

  /** Photo / video URLs uploaded by the supplier. */
  @Property({ type: 'jsonb', nullable: true })
  supplierMediaUrls?: string[];

  // ── Misc ──

  @Property({ nullable: true, type: 'text' })
  note?: string;

  /** Optional in-house coordinator following up on this milestone. */
  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;
}
