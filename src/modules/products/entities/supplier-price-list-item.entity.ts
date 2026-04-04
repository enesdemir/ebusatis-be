import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SupplierPriceList } from './supplier-price-list.entity';
import { ProductVariant } from './product-variant.entity';

/**
 * Tedarikçi Fiyat Listesi Kalemi
 */
@Entity({ tableName: 'supplier_price_list_items' })
export class SupplierPriceListItem extends BaseTenantEntity {
  @ManyToOne(() => SupplierPriceList)
  priceList!: SupplierPriceList;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  moq?: number; // Minimum sipariş miktarı

  @Property({ nullable: true })
  leadTimeDays?: number; // Teslim süresi

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
