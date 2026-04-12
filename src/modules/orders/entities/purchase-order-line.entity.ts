import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';

/**
 * Purchase Order Line
 *
 * One line item per ordered variant. The `receivedQuantity` is bumped
 * by goods receive, and `landedUnitCost` is set by the landed-cost
 * calculation once the related shipment lands and all cost components
 * (freight, customs, broker, insurance, transit storage) are known.
 */
@Entity({ tableName: 'purchase_order_lines' })
export class PurchaseOrderLine extends BaseTenantEntity {
  @ManyToOne(() => PurchaseOrder)
  order!: PurchaseOrder;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  quantity!: number;

  @Property({ type: 'decimal', precision: 14, scale: 4 })
  unitPrice!: number;

  @ManyToOne(() => TaxRate, { nullable: true })
  taxRate?: TaxRate;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineTotal: number = 0;

  /**
   * Quantity received against this line so far. Bumped by the goods
   * receive flow whenever a related GoodsReceiveLine is confirmed.
   */
  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  receivedQuantity: number = 0;

  /**
   * Per-unit landed cost (purchase price + freight + customs + insurance
   * + transit storage + broker fee, all in PO currency, all allocated
   * to this line). Populated by `LandedCostCalculation.applyToLines()`
   * after the related shipment lands. Stored at higher precision than
   * the unit price to keep allocation rounding errors below 1 cent.
   */
  @Property({ type: 'decimal', precision: 14, scale: 4, nullable: true })
  landedUnitCost?: number;

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
