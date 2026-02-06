import { Entity, Property, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
  @Property()
  name: string;

  @Property({ default: false })
  isSystemRole: boolean = false;

  @ManyToOne(() => Tenant, { nullable: true })
  tenant?: Tenant;

  @ManyToMany(() => Permission, 'roles', { owner: true })
  permissions = new Collection<Permission>(this);

  @ManyToMany(() => User, user => user.roles)
  users = new Collection<User>(this);

  constructor(name: string) {
    super();
    this.name = name;
  }
}
