import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Invoice } from './invoice.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';

/**
 * Fatura Satırı
 */
@Entity({ tableName: 'invoice_lines' })
export class InvoiceLine extends BaseTenantEntity {
  @ManyToOne(() => Invoice)
  invoice!: Invoice;

  @Property()
  description!: string;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant?: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount: number = 0; // %

  @ManyToOne(() => TaxRate, { nullable: true })
  taxRate?: TaxRate;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  lineTotal: number = 0;

  @Property({ nullable: true })
  sourceOrderLineId?: string; // SalesOrderLine veya PurchaseOrderLine ID
}
