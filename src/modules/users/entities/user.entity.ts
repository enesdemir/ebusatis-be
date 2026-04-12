import { Entity, Property, ManyToOne, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from '../../iam/entities/role.entity';

/**
 * User
 *
 * Platform-scoped (no tenant filter) because a user can be a
 * SuperAdmin without a tenant, or belong to one tenant as an employee.
 *
 * Stage 0.C additions: `fullName` and `phone` — the master diagram
 * requires identifying the person receiving goods (receivedBy) and
 * the shipment coordinator (shipmentResponsible) by name and phone.
 */
@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property({ unique: true })
  email: string;

  @Property({ hidden: true })
  passwordHash: string;

  /** Display name shown in the UI and on printed documents. */
  @Property({ nullable: true })
  fullName?: string;

  @Property({ nullable: true })
  phone?: string;

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
