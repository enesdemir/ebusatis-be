import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum AttributeType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

@Entity({ tableName: 'attributes' })
export class Attribute extends BaseTenantEntity {
  @Property()
  name: string; // Örn: "En (Width)", "Gramaj", "Materyal"

  @Property()
  code: string; // Örn: "width_cm", "weight_gsm", "material"

  @Enum(() => AttributeType)
  type: AttributeType;

  constructor(name: string, code: string, type: AttributeType, tenant: Tenant) {
    super();
    this.name = name;
    this.code = code;
    this.type = type;
    this.tenant = tenant;
  }
}
