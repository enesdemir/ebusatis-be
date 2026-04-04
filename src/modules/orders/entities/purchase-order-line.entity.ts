import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';

/**
 * Satınalma Siparişi Satırı
 */
@Entity({ tableName: 'purchase_order_lines' })
export class PurchaseOrderLine extends BaseTenantEntity {
  @ManyToOne(() => PurchaseOrder)
  order!: PurchaseOrder;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @ManyToOne(() => TaxRate, { nullable: true })
  taxRate?: TaxRate;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineTotal: number = 0;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  receivedQuantity: number = 0; // Mal kabulden güncellenir

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
