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
import { SalesOrder } from './sales-order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Picking lifecycle.
 *
 * - PENDING: header created, no kartela scanned yet
 * - IN_PROGRESS: at least one PickingLine has been scanned
 * - COMPLETED: every OrderRollAllocation for the SO is picked
 * - CANCELLED: abandoned before completion (reservations stay intact)
 */
export enum PickingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Picking (Sipariş Hazırlama)
 *
 * One Picking header per SalesOrder. The header groups individual
 * PickingLine scans that confirm each allocated roll (kartela) has
 * physically been collected from the warehouse shelves.
 *
 * Flow: SalesOrder(ALLOCATED) → startPicking → scanKartela × N →
 *       completePicking → Packing.
 */
@Entity({ tableName: 'pickings' })
export class Picking extends BaseTenantEntity {
  @Property()
  @Index()
  pickingNumber!: string; // "PK-2026-0001"

  @ManyToOne(() => SalesOrder)
  @Index()
  salesOrder!: SalesOrder;

  @Enum(() => PickingStatus)
  status: PickingStatus = PickingStatus.PENDING;

  @ManyToOne(() => User, { nullable: true })
  picker?: User;

  @Property({ nullable: true, type: 'datetime' })
  startedAt?: Date;

  @Property({ nullable: true, type: 'datetime' })
  completedAt?: Date;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @OneToMany('PickingLine', 'picking')
  lines = new Collection<object>(this);
}
