import { Entity, Property, Enum, ManyToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';

/** Functional purpose of a user group. */
export enum UserGroupType {
  DEPARTMENT = 'DEPARTMENT',
  TEAM = 'TEAM',
  FUNCTIONAL = 'FUNCTIONAL',
  NOTIFICATION_GROUP = 'NOTIFICATION_GROUP',
}

/**
 * User Group
 *
 * Groups users by department, team or functional area so that
 * notifications and scheduled alerts can target a whole group rather
 * than individual user IDs. E.g. "logistics_team", "finance_dept",
 * "qc_inspectors".
 *
 * The ManyToMany to User creates a `user_group_members` join table
 * automatically.
 */
@Entity({ tableName: 'user_groups' })
export class UserGroup extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property()
  @Index()
  code!: string; // tenant-unique, e.g. "logistics_team"

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Enum(() => UserGroupType)
  type: UserGroupType = UserGroupType.TEAM;

  @Property({ default: true })
  isActive: boolean = true;

  @ManyToMany(() => User)
  members = new Collection<User>(this);
}
