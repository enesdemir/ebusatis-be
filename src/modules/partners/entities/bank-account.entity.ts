import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Counterparty } from './counterparty.entity';
import { Currency } from '../../definitions/entities/currency.entity';

/**
 * Banka Hesabı
 * Nerede kullanılır: Ödeme/tahsilat yapılırken banka bilgileri, fatura alt bilgisi
 */
@Entity({ tableName: 'bank_accounts' })
export class BankAccount extends BaseTenantEntity {
  @ManyToOne(() => Counterparty)
  counterparty!: Counterparty;

  @Property()
  bankName!: string;

  @Property()
  iban!: string;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ nullable: true })
  accountHolder?: string;

  @Property({ default: false })
  isDefault: boolean = false;
}
