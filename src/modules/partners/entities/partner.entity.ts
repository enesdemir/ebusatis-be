import { Entity, Property, Enum, ManyToOne, OneToMany, ManyToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Tag } from '../../definitions/entities/tag.entity';

export enum PartnerType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  COMPETITOR = 'COMPETITOR',
}

export enum RiskScore {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  BLOCKED = 'BLOCKED',
}

/**
 * İş Ortağı (Partner) - Ana Firma Kartı
 *
 * Ne işe yarar: Tek bir firma kartı. Aynı firma hem müşteri hem tedarikçi hem rakip olabilir.
 * Nerede kullanılır: SalesOrder.partner, PurchaseOrder.supplier, Invoice.partner, GoodsReceive.supplier, CRM
 *
 * Eski sistemdeki Partner vs Counterparty ayrımı korunuyor:
 * - Partner = firma (ABC Tekstil)
 * - Counterparty = fatura kimliği (ABC İthalat A.Ş., ABC Perakende Ltd.)
 */
@Entity({ tableName: 'partners' })
export class Partner extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  @Index()
  code?: string; // Auto veya manuel

  @Property({ type: 'json', default: '[]' })
  types: PartnerType[] = []; // Çoklu seçim: [CUSTOMER, SUPPLIER]

  @Property({ nullable: true })
  taxId?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true })
  website?: string;

  @ManyToOne(() => Currency, { nullable: true })
  defaultCurrency?: Currency;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  creditLimit: number = 0;

  @Enum(() => RiskScore)
  riskScore: RiskScore = RiskScore.LOW;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @OneToMany('PartnerAddress', 'partner')
  addresses = new Collection<any>(this);

  @OneToMany('PartnerContact', 'partner')
  contacts = new Collection<any>(this);

  @OneToMany('Counterparty', 'partner')
  counterparties = new Collection<any>(this);

  @OneToMany('PartnerRep', 'partner')
  assignedReps = new Collection<any>(this);

  @OneToMany('Interaction', 'partner')
  interactions = new Collection<any>(this);
}
