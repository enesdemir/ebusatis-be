import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Payment } from './payment.entity';
import { Invoice } from './invoice.entity';

/**
 * Ödeme-Fatura Eşleştirmesi
 *
 * Bir ödeme birden fazla faturaya, bir fatura birden fazla ödemeden karşılanabilir.
 */
@Entity({ tableName: 'payment_invoice_matches' })
export class PaymentInvoiceMatch extends BaseTenantEntity {
  @ManyToOne(() => Payment)
  payment!: Payment;

  @ManyToOne(() => Invoice)
  invoice!: Invoice;

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  matchedAmount!: number;

  @Property({ type: 'datetime' })
  matchedAt: Date = new Date();
}
