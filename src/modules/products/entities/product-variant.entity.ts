import { Entity, Property, ManyToOne, Collection, OneToMany, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';
import { ProductVariantAttributeValue } from './product-variant-attribute-value.entity';
import { Currency } from '../../definitions/entities/currency.entity';

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
  weight?: number; // Gramaj: 450 gr/m²

  @Property({ nullable: true })
  martindale?: number; // Sürtünme katsayısı (döşemelik)

  // ─── Görsel ve Barkod ─────────────────────────────────────

  @Property({ nullable: true })
  primaryImageUrl?: string; // Ana görsel URL (FileUpload entegrasyonu ileride)

  @Property({ nullable: true })
  barcode?: string; // Varyant barkodu

  // ─── Durum ────────────────────────────────────────────────

  @Property({ default: true })
  isActive: boolean = true;

  // ─── EAV ──────────────────────────────────────────────────

  @OneToMany(() => ProductVariantAttributeValue, attrValue => attrValue.variant)
  attributeValues = new Collection<ProductVariantAttributeValue>(this);

  constructor(name: string, sku: string, product: Product) {
    super();
    this.name = name;
    this.sku = sku;
    this.product = product;
    this.price = 0;
  }
}
