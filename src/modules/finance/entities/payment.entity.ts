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

export enum PaymentDirection {
  INCOMING = 'INCOMING', // Tahsilat (müşteriden)
  OUTGOING = 'OUTGOING', // Ödeme (tedarikçiye)
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Ödeme / Tahsilat (Payment)
 *
 * Ne işe yarar: Para giriş/çıkışı. Faturalarla eşleştirilir.
 * Nerede kullanılır: Finans > Ödemeler, cari hesap ekstresi, vade analizi
 */
@Entity({ tableName: 'payments' })
export class Payment extends BaseTenantEntity {
  @Property()
  @Index()
  paymentNumber!: string; // "PAY-2026-0001"

  @Enum(() => PaymentDirection)
  direction!: PaymentDirection;

  @ManyToOne(() => Partner)
  partner!: Partner;

  @ManyToOne(() => Counterparty, { nullable: true })
  counterparty?: Counterparty;

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: number;

  @Property({ type: 'date' })
  paymentDate: Date = new Date();

  @ManyToOne(() => PaymentMethod, { nullable: true })
  method?: PaymentMethod;

  @Property({ nullable: true })
  reference?: string; // Dekont no, çek no

  @Property({ nullable: true })
  bankAccount?: string;

  @Enum(() => PaymentStatus)
  status: PaymentStatus = PaymentStatus.COMPLETED;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('PaymentInvoiceMatch', 'payment')
  matchedInvoices = new Collection<any>(this);
}
