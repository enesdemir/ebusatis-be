import {
  Entity,
  Property,
  ManyToOne,
  ManyToMany,
  OneToMany,
  Collection,
  Enum,
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
 * Sales order type — distinguishes fabric (metre-based) from product
 * (unit-based) orders. Fabric orders require roll allocation + cutting;
 * product orders require BOM (bill of materials) checks.
 */
export enum SalesOrderType {
  FABRIC = 'FABRIC',
  PRODUCT = 'PRODUCT',
}

/**
 * Payment type for the order.
 *
 * - `CASH` — paid in full before fulfillment (PENDING_PAYMENT gate)
 * - `CREDIT` — deferred, subject to credit limit check
 * - `PARTIAL` — down-payment + remainder on credit
 */
export enum SalesOrderPaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  PARTIAL = 'PARTIAL',
}

/**
 * Sales order status machine.
 *
 * Flow: DRAFT → PENDING_PAYMENT | PENDING_CREDIT_APPROVAL → APPROVED →
 *       ALLOCATED → READY_FOR_SHIPMENT → SHIPPED → DELIVERED
 * Alternate branches: CANCELLED, BLOCKED_AWAITING_MATERIAL
 */
export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_CREDIT_APPROVAL = 'PENDING_CREDIT_APPROVAL',
  BLOCKED_AWAITING_MATERIAL = 'BLOCKED_AWAITING_MATERIAL',
  APPROVED = 'APPROVED',
  ALLOCATED = 'ALLOCATED',
  READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

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

  /**
   * Order type: FABRIC (metre-based, requires roll allocation) or
   * PRODUCT (unit-based, requires BOM component check).
   */
  @Enum(() => SalesOrderType)
  orderType: SalesOrderType = SalesOrderType.FABRIC;

  /**
   * Payment type — independent of the `paymentMethod` FK which refers
   * to the channel (bank transfer, cash, card, check). This enum captures
   * the timing/conditions (cash vs credit vs partial).
   */
  @Enum(() => SalesOrderPaymentType)
  paymentType: SalesOrderPaymentType = SalesOrderPaymentType.CASH;

  /**
   * Down-payment percentage when `paymentType` is PARTIAL.
   * Value between 0 and 100. Null otherwise.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  partialPaymentRate?: number;

  /**
   * Workflow state — mirrors the `status` FK (StatusDefinition) but gives
   * a strongly-typed, code-level enum for business logic. Use this for
   * gating transitions, not for display labels.
   */
  @Enum(() => SalesOrderStatus)
  workflowStatus: SalesOrderStatus = SalesOrderStatus.DRAFT;

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
  lines = new Collection<object>(this);
}
