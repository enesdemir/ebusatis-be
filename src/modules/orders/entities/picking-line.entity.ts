import { Entity, Property, ManyToOne, Index, Unique } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Picking } from './picking.entity';
import { OrderRollAllocation } from './order-roll-allocation.entity';
import { SalesOrderLine } from './sales-order-line.entity';
import { User } from '../../users/entities/user.entity';

/**
 * PickingLine — one scan per OrderRollAllocation.
 *
 * When a warehouse operator scans a kartela barcode, the service
 * creates a PickingLine that ties the Picking header to the specific
 * allocation. The (picking, allocation) pair is unique so the same
 * roll cannot be picked twice for the same header.
 */
@Entity({ tableName: 'picking_lines' })
@Unique({
  properties: ['picking', 'allocation'],
  name: 'uq_picking_line_allocation',
})
export class PickingLine extends BaseTenantEntity {
  @ManyToOne(() => Picking)
  @Index()
  picking!: Picking;

  @ManyToOne(() => OrderRollAllocation)
  allocation!: OrderRollAllocation;

  @ManyToOne(() => SalesOrderLine)
  orderLine!: SalesOrderLine;

  /** Scanned barcode — captured verbatim for audit. */
  @Property()
  scannedBarcode!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  pickedQuantity!: number;

  @Property({ type: 'datetime' })
  scannedAt: Date = new Date();

  @ManyToOne(() => User, { nullable: true })
  scannedBy?: User;
}
