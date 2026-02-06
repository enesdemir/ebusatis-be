import { Entity, Property, Enum } from '@mikro-orm/core';
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

  constructor(name: string, domain: string) {
    super();
    this.name = name;
    this.domain = domain;
  }
}
