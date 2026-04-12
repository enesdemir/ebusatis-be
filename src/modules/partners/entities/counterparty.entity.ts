import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';

export enum CounterpartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

/**
 * Cari Hesap / Tüzel Kişilik (Counterparty)
 *
 * Ne işe yarar: Aynı firmanın farklı fatura kimlikleri.
 * "ABC Tekstil" firmasının "ABC İthalat A.Ş." ve "ABC Perakende Ltd." gibi iki ayrı carisi olabilir.
 *
 * Nerede kullanılır: Invoice.counterparty, Payment.counterparty, cari hesap ekstresi
 */
@Entity({ tableName: 'counterparties' })
export class Counterparty extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  partner!: Partner;

  @Property()
  legalName!: string; // "ABC İthalat A.Ş."

  @Property({ nullable: true })
  taxId?: string;

  @Property({ nullable: true })
  taxOffice?: string; // "Kadıköy VD"

  @Enum(() => CounterpartyType)
  type: CounterpartyType = CounterpartyType.COMPANY;

  @Property({ default: false })
  isDefault: boolean = false; // Partner'ın varsayılan carisi

  @Property({ default: true })
  isActive: boolean = true;

  @OneToMany('BankAccount', 'counterparty')
  bankAccounts = new Collection<any>(this);
}
