import { Entity, Property, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from '../../iam/entities/role.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property({ unique: true })
  email: string;

  @Property({ hidden: true })
  passwordHash: string;

  @Property({ default: false })
  isSuperAdmin: boolean = false;

  @Property({ default: false })
  isTenantOwner: boolean = false;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 'tr' })
  locale: string = 'tr';

  @Property({ nullable: true, type: 'datetime' })
  lastLoginAt?: Date;

  @ManyToOne(() => Tenant, { nullable: true })
  tenant?: Tenant;

  @ManyToMany(() => Role, role => role.users, { owner: true })
  roles = new Collection<Role>(this);

  constructor(email: string, tenant?: Tenant) {
    super();
    this.email = email;
    this.tenant = tenant;
  }
}
