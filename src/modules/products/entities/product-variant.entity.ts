import {
  Entity,
  Property,
  ManyToOne,
  Collection,
  OneToMany,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';
import { ProductVariantAttributeValue } from './product-variant-attribute-value.entity';
import { Currency } from '../../definitions/entities/currency.entity';

/**
 * Production lifecycle status for a product variant.
 *
 * Tracks whether the supplier is currently producing this variant,
 * has finished or has not started yet. Updated either manually or by
 * the SupplierProductionOrder lifecycle.
 */
export enum VariantProductionStatus {
  PENDING = 'PENDING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  PRODUCED = 'PRODUCED',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * Ürün Varyantı (Product Variant) - Renk/Desen Katmanı
 *
 * Siparişler ve stok aslında varyanta bağlanır, ürüne değil.
 * Her varyantın altında fiziksel toplar (InventoryItem) bulunur.
 *
 * Ne işe yarar: Bir kumaş serisinin (Product) renk/desen kırılımı.
 * Nerede kullanılır: InventoryItem.variant, OrderLine.variant, dijital kartela
 */
@Entity({ tableName: 'product_variants' })
export class ProductVariant extends BaseTenantEntity {
  @Property()
  name: string; // "Zümrüt Yeşili", "Antrasit Gri"

  @Property()
  @Index()
  sku: string; // "PRM-VLV-ZMR"

  @ManyToOne(() => Product)
  product: Product;

  // ─── Fiyatlandırma ────────────────────────────────────────

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number = 0; // Baz toptan satış fiyatı

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice?: number; // Maliyet fiyatı (kârlılık hesabı için)

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderQuantity?: number; // Bu varyant için minimum sipariş

  // ─── Tekstil Teknik Spesifikasyonlar ──────────────────────

  @Property({ nullable: true })
  colorCode?: string; // Pantone/Hex renk kodu

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number; // En: 280.0 cm

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number; // General weight field: 450 gr/m²

  /**
   * Standard GSM (grams per square metre) — reference value for textile.
   * Used by GsmCheckService to compare against measured `actualGSM` on rolls.
   * Separate from `weight` to keep textile-specific semantics clear.
   */
  @Property({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  standardGSM?: number;

  /**
   * Acceptable GSM deviation percent (default 5%).
   * Rolls with variance > tolerance should be quarantined.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  gsmTolerance: number = 5;

  @Property({ nullable: true })
  martindale?: number; // Abrasion coefficient (upholstery)

  // ─── Görsel ve Barkod ─────────────────────────────────────

  @Property({ nullable: true })
  primaryImageUrl?: string; // Ana görsel URL (FileUpload entegrasyonu ileride)

  @Property({ nullable: true })
  barcode?: string; // Varyant barkodu

  // ── Status ─────────────────────────────────────────────────

  @Property({ default: true })
  isActive: boolean = true;

  /** Supplier production lifecycle. Updated by the production module. */
  @Enum({ items: () => VariantProductionStatus, nullable: true })
  productionStatus?: VariantProductionStatus;

  // ─── EAV ──────────────────────────────────────────────────

  @OneToMany(
    () => ProductVariantAttributeValue,
    (attrValue) => attrValue.variant,
  )
  attributeValues = new Collection<ProductVariantAttributeValue>(this);

  constructor(name: string, sku: string, product: Product) {
    super();
    this.name = name;
    this.sku = sku;
    this.product = product;
    this.price = 0;
  }
}
