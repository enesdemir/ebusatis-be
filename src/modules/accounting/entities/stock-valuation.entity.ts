import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from '../../products/entities/product.entity';

export enum ValuationMethod {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  AVERAGE = 'AVERAGE',
}

/**
 * Stok Degerleme — FIFO/LIFO/Ortalama maliyet hesabi.
 * Donemsel olarak hesaplanir.
 */
@Entity({ tableName: 'stock_valuations' })
export class StockValuation extends BaseTenantEntity {
  @Property({ type: 'date' })
  periodDate!: Date;

  @ManyToOne(() => Product, { nullable: true })
  product?: Product;

  @Enum(() => ValuationMethod)
  method: ValuationMethod = ValuationMethod.FIFO;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalQuantity: number = 0;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost: number = 0;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unitCost: number = 0;

  @Property({ nullable: true })
  currency?: string;

  @Property({ type: 'json', nullable: true })
  layers?: Array<{ date: string; quantity: number; unitCost: number; totalCost: number }>;

  @Property({ nullable: true })
  note?: string;
}
