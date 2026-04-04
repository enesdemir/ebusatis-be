import { Entity, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SalesOrder } from './sales-order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';

/**
 * Satış Siparişi Satırı
 *
 * Her satır: bir varyant + istenen miktar + birim fiyat + tahsis edilen toplar
 */
@Entity({ tableName: 'sales_order_lines' })
export class SalesOrderLine extends BaseTenantEntity {
  @ManyToOne(() => SalesOrder)
  order!: SalesOrder;

  @Property({ default: 1 })
  lineNumber: number = 1;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  requestedQuantity!: number; // İstenen miktar (20m)

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number = 0; // İndirim %

  @ManyToOne(() => TaxRate, { nullable: true })
  taxRate?: TaxRate;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineTotal: number = 0;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @OneToMany('OrderRollAllocation', 'orderLine')
  allocations = new Collection<any>(this);
}
