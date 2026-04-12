import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { PurchaseOrderLine } from '../../orders/entities/purchase-order-line.entity';
import { SalesOrderLine } from '../../orders/entities/sales-order-line.entity';

/**
 * Shipment Line
 *
 * One row per variant being shipped. Linked back to either a
 * PurchaseOrderLine (INBOUND) or a SalesOrderLine (OUTBOUND); the XOR
 * mirrors the parent shipment's `direction` and is enforced at the
 * service layer.
 *
 * For roll-based textile inventory, `rollIds` keeps the list of
 * physical rolls included in this line. The list is stored as a JSON
 * array to avoid an extra join table; rolls cannot belong to more than
 * one shipment line at a time.
 */
@Entity({ tableName: 'shipment_lines' })
export class ShipmentLine extends BaseTenantEntity {
  @ManyToOne(() => Shipment)
  @Index()
  shipment!: Shipment;

  /** Set when the parent shipment direction = INBOUND. */
  @ManyToOne(() => PurchaseOrderLine, { nullable: true })
  purchaseOrderLine?: PurchaseOrderLine;

  /** Set when the parent shipment direction = OUTBOUND. */
  @ManyToOne(() => SalesOrderLine, { nullable: true })
  salesOrderLine?: SalesOrderLine;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  /** Roll IDs included in this shipment line (textile-domain). */
  @Property({ type: 'jsonb', default: '[]' })
  rollIds: string[] = [];

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
