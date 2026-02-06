import { Entity, Property, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity {
  @Property({ unique: true })
  slug: string; // e.g., 'order.create'

  @Property()
  category: string; // e.g., 'Inventory'

  @Property({ nullable: true })
  description?: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles = new Collection<Role>(this);

  constructor(slug: string, category: string) {
    super();
    this.slug = slug;
    this.category = category;
  }
}
