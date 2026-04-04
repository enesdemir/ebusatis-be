import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductVariant } from './product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity({ tableName: 'products' })
export class Product extends BaseTenantEntity {
  @Property()
  name: string;

  @Property({ nullable: true })
  code?: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: 'Meter' })
  baseUnit: string = 'Meter';

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants = new Collection<ProductVariant>(this);

  // EAV - Dinamik Özellikler Bağlantısı
  @OneToMany(() => ProductAttributeValue, attrValue => attrValue.product)
  attributeValues = new Collection<ProductAttributeValue>(this);

  constructor(name: string, tenant: Tenant) {
    super();
    this.name = name;
    this.tenant = tenant;
  }
}
