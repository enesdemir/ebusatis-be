import { Entity, Property, Enum, ManyToOne, ManyToMany, OneToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Category } from '../../definitions/entities/category.entity';
import { UnitOfMeasure } from '../../definitions/entities/unit-of-measure.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';
import { Tag } from '../../definitions/entities/tag.entity';

export enum TrackingStrategy {
  SERIAL = 'SERIAL',   // Top/rulo bazlı takip (barkodlu, lot'lu)
  BULK = 'BULK',       // Dökme takip (toplam miktar)
}

/**
 * Ürün (Product) - Ana Ürün Kartı
 *
 * Hiyerarşi: Product > ProductVariant > InventoryItem (Roll)
 *
 * Ne işe yarar: Kumaş serisini tanımlar. Her ürünün altında renk/desen varyantları bulunur.
 * Nerede kullanılır: PIM kataloğu, sipariş satırı, stok takibi, dijital kartela
 */
@Entity({ tableName: 'products' })
export class Product extends BaseTenantEntity {
  @Property()
  name: string; // "Premium Velvet", "İtalyan Keten Fon Perde"

  @Property({ nullable: true })
  @Index()
  code?: string; // "PRM-VLV"

  @Property({ nullable: true, type: 'text' })
  description?: string;

  // ─── Kademe 1 Referansları ────────────────────────────────

  @ManyToOne(() => Category, { nullable: true })
  category?: Category; // Perdelik > Fon Perde

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  unit?: UnitOfMeasure; // Metre, Kg, Adet

  @ManyToOne(() => TaxRate, { nullable: true })
  taxRate?: TaxRate; // Varsayılan KDV oranı

  // ─── Tekstil Spesifik Alanlar ─────────────────────────────

  @Enum(() => TrackingStrategy)
  trackingStrategy: TrackingStrategy = TrackingStrategy.SERIAL;

  @Property({ nullable: true })
  fabricComposition?: string; // "%80 Pamuk, %20 Polyester"

  @Property({ nullable: true })
  washingInstructions?: string; // Yıkama talimatları

  @Property({ nullable: true })
  collectionName?: string; // "SS26 Collection"

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  moq?: number; // Minimum sipariş miktarı

  @Property({ nullable: true })
  origin?: string; // Menşei: "Türkiye", "İtalya"

  // ─── Durum ve Etiket ──────────────────────────────────────

  @Property({ default: true })
  isActive: boolean = true;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  // ─── İlişkiler ────────────────────────────────────────────

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants = new Collection<ProductVariant>(this);

  @OneToMany(() => ProductAttributeValue, attrValue => attrValue.product)
  attributeValues = new Collection<ProductAttributeValue>(this);

  // Geriye uyumluluk: eski baseUnit alanını unit relation üzerinden çöz
  @Property({ default: 'Meter', persist: false })
  get baseUnit(): string {
    return (this.unit as any)?.code || 'Meter';
  }

  constructor(name: string, tenant: Tenant) {
    super();
    this.name = name;
    this.tenant = tenant;
  }
}
