import { Entity, Property, Enum, ManyToOne, OneToMany, ManyToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Tag } from '../../definitions/entities/tag.entity';

export enum PartnerType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  COMPETITOR = 'COMPETITOR',
}

/**
 * Customer sub-category (stage 0.C).
 *
 * Allows the sales team to filter and group customers by channel
 * without needing a separate entity.
 */
export enum CustomerSubtype {
  DEALER = 'DEALER',
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
  B2B = 'B2B',
  SHOWROOM = 'SHOWROOM',
  ONLINE = 'ONLINE',
}

/**
 * Supplier sub-category (stage 0.C).
 *
 * Clarifies the supplier's role in the supply chain so purchase
 * orders and production tracking can be filtered by capability.
 */
export enum SupplierSubtype {
  FABRIC_FACTORY = 'FABRIC_FACTORY',
  RAW_MATERIAL = 'RAW_MATERIAL',
  PACKAGING = 'PACKAGING',
  LOGISTICS_PROVIDER = 'LOGISTICS_PROVIDER',
}

export enum RiskScore {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  BLOCKED = 'BLOCKED',
}

/**
 * Partner
 *
 * A single company card. The same firm can be a customer, a supplier
 * and a competitor at the same time (multi-type via `types` JSON array).
 *
 * Stage 0.C additions: `customerSubtype` and `supplierSubtype` enums
 * for more granular classification within the customer / supplier axes.
 */
@Entity({ tableName: 'partners' })
export class Partner extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  @Index()
  code?: string;

  @Property({ type: 'json', default: '[]' })
  types: PartnerType[] = [];

  /** More granular customer classification (set when types includes CUSTOMER). */
  @Enum({ items: () => CustomerSubtype, nullable: true })
  customerSubtype?: CustomerSubtype;

  /** More granular supplier classification (set when types includes SUPPLIER). */
  @Enum({ items: () => SupplierSubtype, nullable: true })
  supplierSubtype?: SupplierSubtype;

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
