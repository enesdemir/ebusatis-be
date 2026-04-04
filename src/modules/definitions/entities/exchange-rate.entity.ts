import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Currency } from './currency.entity';

export enum ExchangeRateSource {
  MANUAL = 'MANUAL',
  API = 'API',
}

/**
 * Döviz Kuru (Exchange Rate)
 *
 * Ne işe yarar: Para birimleri arası dönüşüm oranları. Raporlama ve kur farkı hesabı için kritik.
 * Nerede kullanılır: Sipariş/fatura oluşturulurken kur çekme, kur farkı kar/zarar raporu
 */
@Entity({ tableName: 'exchange_rates' })
export class ExchangeRate extends BaseTenantEntity {
  @ManyToOne(() => Currency)
  fromCurrency!: Currency;

  @ManyToOne(() => Currency)
  toCurrency!: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6 })
  rate!: number; // Ör: 1 USD = 34.500000 TRY

  @Property({ type: 'date' })
  effectiveDate!: Date;

  @Enum(() => ExchangeRateSource)
  source: ExchangeRateSource = ExchangeRateSource.MANUAL;
}
