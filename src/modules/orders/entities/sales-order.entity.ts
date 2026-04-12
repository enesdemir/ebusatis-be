import {
  Entity,
  Property,
  ManyToOne,
  ManyToMany,
  OneToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Counterparty } from '../../partners/entities/counterparty.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { PaymentMethod } from '../../definitions/entities/payment-method.entity';
import { DeliveryMethod } from '../../definitions/entities/delivery-method.entity';
import { StatusDefinition } from '../../definitions/entities/status-definition.entity';
import { Tag } from '../../definitions/entities/tag.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Satış Siparişi (Sales Order)
 *
 * Ne işe yarar: Müşteriden gelen sipariş. Satırlarında varyant + miktar + tahsis edilen toplar bulunur.
 * Nerede kullanılır: Sipariş listesi, rulo tahsis/kesim, sevkiyat, faturalama
 *
 * Akış: Taslak → Onay → Hazırlık (rulo tahsis + kesim) → Sevk → Teslim
 */
@Entity({ tableName: 'sales_orders' })
export class SalesOrder extends BaseTenantEntity {
  @Property()
  @Index()
  orderNumber!: string; // "SO-2026-0001" (tenant-scoped auto-increment)

  @ManyToOne(() => Partner)
  partner!: Partner;

  @ManyToOne(() => Counterparty, { nullable: true })
  counterparty?: Counterparty;

  @ManyToOne(() => Warehouse, { nullable: true })
  warehouse?: Warehouse; // Çıkış deposu

  // ─── Döviz ────────────────────────────────────────────────

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: number; // Sipariş anındaki kur

  // ─── Durum ve Tarih ───────────────────────────────────────

  @ManyToOne(() => StatusDefinition, { nullable: true })
  status?: StatusDefinition;

  @Property({ type: 'date' })
  orderDate: Date = new Date();

  @Property({ nullable: true, type: 'date' })
  expectedDeliveryDate?: Date;

  // ─── Ödeme ve Teslimat ────────────────────────────────────

  @ManyToOne(() => PaymentMethod, { nullable: true })
  paymentMethod?: PaymentMethod;

  @ManyToOne(() => DeliveryMethod, { nullable: true })
  deliveryMethod?: DeliveryMethod;

  // ─── Tutarlar ─────────────────────────────────────────────

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discountAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  grandTotal: number = 0;

  // ─── Notlar ───────────────────────────────────────────────

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @Property({ nullable: true, type: 'text' })
  internalNote?: string; // Sadece iç kullanım

  // ─── İlişkiler ────────────────────────────────────────────

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User; // Sorumlu satış temsilcisi

  @ManyToOne(() => User)
  createdBy!: User;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @OneToMany('SalesOrderLine', 'order')
  lines = new Collection<any>(this);
}
