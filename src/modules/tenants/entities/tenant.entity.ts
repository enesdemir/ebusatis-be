import { Entity, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum TenantType {
  SAAS = 'SAAS',
  ON_PREM_LICENSE = 'ON_PREM_LICENSE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

@Entity({ tableName: 'tenants' })
export class Tenant extends BaseEntity {
  @Property()
  name: string;

  @Property({ unique: true })
  domain: string;

  @Enum(() => TenantType)
  type: TenantType = TenantType.SAAS;

  @Enum(() => SubscriptionStatus)
  subscriptionStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;

  @Property({ type: 'json' })
  features: Record<string, boolean> = { stock: true, b2b: false, production: false, invoice: false };

  @OneToMany('User', 'tenant')
  users = new Collection<any>(this);

  constructor(name: string, domain: string) {
    super();
    this.name = name;
    this.domain = domain;
  }
}
