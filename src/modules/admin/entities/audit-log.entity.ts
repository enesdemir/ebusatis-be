import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  IMPERSONATE = 'IMPERSONATE',
  TENANT_CREATED = 'TENANT_CREATED',
  TENANT_UPDATED = 'TENANT_UPDATED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  TENANT_ACTIVATED = 'TENANT_ACTIVATED',
  TENANT_DELETED = 'TENANT_DELETED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  ROLE_CREATED = 'ROLE_CREATED',
  ROLE_UPDATED = 'ROLE_UPDATED',
  ROLE_DELETED = 'ROLE_DELETED',
  PERMISSION_CREATED = 'PERMISSION_CREATED',
  PERMISSION_UPDATED = 'PERMISSION_UPDATED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CONFIG_UPDATED = 'CONFIG_UPDATED',
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_UPDATED = 'PLAN_UPDATED',
  MODULE_UPDATED = 'MODULE_UPDATED',
}

@Entity({ tableName: 'audit_logs' })
export class AuditLog extends BaseEntity {
  @Enum(() => AuditAction)
  action: AuditAction;

  @Property()
  actorId: string;

  @Property()
  actorEmail: string;

  @Property({ nullable: true })
  tenantId?: string;

  @Property({ nullable: true })
  tenantName?: string;

  @Property({ nullable: true })
  ipAddress?: string;

  @Property({ nullable: true })
  userAgent?: string;

  @Property({ type: 'json', nullable: true })
  details?: Record<string, any>;

  @Property({ nullable: true })
  entityType?: string;

  @Property({ nullable: true })
  entityId?: string;

  constructor(action: AuditAction, actorId: string, actorEmail: string) {
    super();
    this.action = action;
    this.actorId = actorId;
    this.actorEmail = actorEmail;
  }
}
