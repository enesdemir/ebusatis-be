import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/**
 * LeadSource — where a lead came from (FAIR, WEB_FORM, REFERRAL, …).
 * Tenant-scoped unique by code so channel analytics can aggregate.
 */
@Entity({ tableName: 'lead_sources' })
@Unique({
  properties: ['tenant', 'code'],
  name: 'uq_lead_source_code_per_tenant',
})
export class LeadSource extends BaseTenantEntity {
  @Property()
  code!: string;

  @Property()
  name!: string;

  @Property({ default: true })
  isActive: boolean = true;
}
