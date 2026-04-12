import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Counterparty } from '../../partners/entities/counterparty.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { PaymentMethod } from '../../definitions/entities/payment-method.entity';
import { User } from '../../users/entities/user.entity';

export enum InvoiceType {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  RETURN_SALES = 'RETURN_SALES',
  RETURN_PURCHASE = 'RETURN_PURCHASE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

/**
 * Fatura (Invoice)
 *
 * Ne işe yarar: Satış/satınalma faturası. Sipariş veya sevkiyattan oluşturulabilir.
 * Nerede kullanılır: Finans > Faturalar, cari hesap ekstresi, kârlılık raporu
 */
@Entity({ tableName: 'invoices' })
export class Invoice extends BaseTenantEntity {
  @Property()
  @Index()
  invoiceNumber!: string; // "INV-2026-0001"

  @Enum(() => InvoiceType)
  type!: InvoiceType;

  @ManyToOne(() => Partner)
  partner!: Partner;

  @ManyToOne(() => Counterparty, { nullable: true })
  counterparty?: Counterparty;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: number;

  @Property({ type: 'date' })
  issueDate: Date = new Date();

  @Property({ nullable: true, type: 'date' })
  dueDate?: Date;

  @Enum(() => InvoiceStatus)
  status: InvoiceStatus = InvoiceStatus.DRAFT;

  // ─── Tutarlar ─────────────────────────────────────────────

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discountAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  grandTotal: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  paidAmount: number = 0; // Ödenen toplam (Payment eşleştirmelerinden)

  // remainingAmount = grandTotal - paidAmount (computed)

  @ManyToOne(() => PaymentMethod, { nullable: true })
  paymentMethod?: PaymentMethod;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  // ─── Kaynak belge referansı ───────────────────────────────

  @Property({ nullable: true })
  sourceOrderId?: string; // SalesOrder veya PurchaseOrder ID

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('InvoiceLine', 'invoice')
  lines = new Collection<object>(this);
}
