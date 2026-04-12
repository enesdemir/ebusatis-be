import {
  Entity,
  Property,
  ManyToOne,
  Enum,
  OneToMany,
  Collection,
  Unique,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { WarehouseLocation } from '../../definitions/entities/warehouse-location.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Partner } from '../../partners/entities/partner.entity';

export enum InventoryItemStatus {
  IN_STOCK = 'IN_STOCK',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  CONSUMED = 'CONSUMED',
  LOST = 'LOST',
  WASTE = 'WASTE',
}

/**
 * Stok Kalemi / Top (Inventory Item / Roll) - CORE ENTITY
 *
 * Tekstil ERP'nin kalbi. Her fiziksel top kumaş, benzersiz bir barkodla izlenen tekil bir varlıktır.
 * Standart e-ticaret mantığından (product.stock_qty) tamamen farklıdır.
 *
 * Senaryo: 50m'lik bir top (R1) var. Müşteri 10m istedi.
 * 1. R1'den 10m rezerve edilir (reservedQuantity += 10)
 * 2. Kesim onaylandığında: currentQuantity = 40m, InventoryTransaction kaydı oluşur
 *
 * Nerede kullanılır: WMS stok listesi, sipariş rulo seçimi, mal kabul, kesim, sevkiyat
 */
@Entity({ tableName: 'inventory_items' })
@Unique({ properties: ['tenant', 'barcode'] })
export class InventoryItem extends BaseTenantEntity {
  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property()
  @Index()
  barcode!: string;

  @Property({ nullable: true })
  @Index()
  batchCode?: string; // Lot/Parti numarası (renk farkı yönetimi için kritik)

  // ─── Miktar Yönetimi ──────────────────────────────────────

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  initialQuantity!: number; // İlk geliş metrajı (50m)

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  currentQuantity!: number; // Kalan metraj (23.40m)

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reservedQuantity: number = 0; // Siparişe tahsis edilen (henüz kesilmemiş)

  // availableQuantity = currentQuantity - reservedQuantity (computed, persist etmiyoruz)

  // ─── Konum ────────────────────────────────────────────────

  @ManyToOne(() => Warehouse, { nullable: true })
  warehouse?: Warehouse;

  @ManyToOne(() => WarehouseLocation, { nullable: true })
  location?: WarehouseLocation;

  // ─── Maliyet ve Kaynak ────────────────────────────────────

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice?: number; // Birim maliyeti (metre başına)

  @ManyToOne(() => Currency, { nullable: true })
  costCurrency?: Currency;

  @ManyToOne(() => Partner, { nullable: true })
  receivedFrom?: Partner; // Hangi tedarikçiden geldi

  @Property({ nullable: true, type: 'datetime' })
  receivedAt?: Date; // Depoya giriş tarihi

  // ─── Mal Kabul Referansı ──────────────────────────────────

  @Property({ nullable: true })
  goodsReceiveId?: string; // GoodsReceive FK (string olarak, circular dep önlemek için)

  // ─── Durum ────────────────────────────────────────────────

  @Enum(() => InventoryItemStatus)
  status: InventoryItemStatus = InventoryItemStatus.IN_STOCK;

  @Property({ nullable: true, type: 'datetime' })
  expiresAt?: Date; // Son kullanma (bazı kumaşlar için)

  // ─── İşlemler ─────────────────────────────────────────────

  @OneToMany('InventoryTransaction', 'item')
  transactions = new Collection<object>(this);

  constructor(
    variant: ProductVariant,
    tenant: Tenant,
    barcode: string,
    quantity: number,
  ) {
    super();
    this.variant = variant;
    this.tenant = tenant;
    this.barcode = barcode;
    this.initialQuantity = quantity;
    this.currentQuantity = quantity;
  }
}
