import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum AttributeType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

@Entity({ tableName: 'attributes' })
export class Attribute extends BaseEntity {
  @Property()
  name: string; // Örn: "En (Width)", "Gramaj", "Materyal"

  @Property()
  code: string; // Örn: "width_cm", "weight_gsm", "material"

  @Enum(() => AttributeType)
  type: AttributeType;

  @ManyToOne(() => Tenant)
  tenant: Tenant; // Her firma (Tenant) sistemi kendi sektörüne göre özelleştirebilir

  constructor(name: string, code: string, type: AttributeType, tenant: Tenant) {
    super();
    this.name = name;
    this.code = code;
    this.type = type;
    this.tenant = tenant;
  }
}
