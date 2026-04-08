import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/**
 * Kur Farki Kaydi — Dovizli islemlerin kur farki hesabi.
 * Alis kuru vs odeme kuru farki → kar/zarar.
 */
@Entity({ tableName: 'exchange_gain_losses' })
export class ExchangeGainLoss extends BaseTenantEntity {
  @Property()
  fromCurrency!: string;

  @Property()
  toCurrency!: string;

  @Property({ type: 'date' })
  transactionDate!: Date;

  @Property({ type: 'date', nullable: true })
  settlementDate?: Date;

  @Property({ type: 'decimal', precision: 12, scale: 6 })
  originalRate!: number;

  @Property({ type: 'decimal', precision: 12, scale: 6, nullable: true })
  settlementRate?: number;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gainLoss: number = 0;

  @Property({ nullable: true })
  referenceType?: string; // Invoice, Payment

  @Property({ nullable: true })
  referenceId?: string;

  @Property({ nullable: true })
  note?: string;
}
