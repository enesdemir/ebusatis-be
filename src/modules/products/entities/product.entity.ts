import { Entity, Property, OneToMany, Collection, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductVariant } from './product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @Property()
  name: string;

  @Property({ nullable: true })
  code?: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: 'Meter' })
  baseUnit: string = 'Meter';

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants = new Collection<ProductVariant>(this);

  constructor(name: string, tenant: Tenant) {
    super();
    this.name = name;
    this.tenant = tenant;
  }
}
