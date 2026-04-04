import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { DigitalCatalog } from './digital-catalog.entity';
import { ProductVariant } from './product-variant.entity';

/**
 * Dijital Kartela Kalemi
 */
@Entity({ tableName: 'digital_catalog_items' })
export class DigitalCatalogItem extends BaseTenantEntity {
  @ManyToOne(() => DigitalCatalog)
  catalog!: DigitalCatalog;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  customPrice?: number; // Müşteriye özel fiyat

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @Property({ default: 0 })
  sortOrder: number = 0;
}
