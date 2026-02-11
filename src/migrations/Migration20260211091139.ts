import { Migration } from '@mikro-orm/migrations';

export class Migration20260211091139 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "audit_logs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "action" text check ("action" in ('LOGIN', 'LOGOUT', 'IMPERSONATE', 'TENANT_CREATED', 'TENANT_UPDATED', 'TENANT_SUSPENDED', 'TENANT_ACTIVATED', 'TENANT_DELETED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSION_CREATED', 'PERMISSION_UPDATED', 'PASSWORD_RESET', 'CONFIG_UPDATED', 'PLAN_CREATED', 'PLAN_UPDATED', 'MODULE_UPDATED')) not null, "actor_id" varchar(255) not null, "actor_email" varchar(255) not null, "tenant_id" varchar(255) null, "tenant_name" varchar(255) null, "ip_address" varchar(255) null, "user_agent" varchar(255) null, "details" jsonb null, "entity_type" varchar(255) null, "entity_id" varchar(255) null, constraint "audit_logs_pkey" primary key ("id"));`);

    this.addSql(`create table "platform_configs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "key" varchar(255) not null, "value" text not null, "category" text check ("category" in ('GENERAL', 'SECURITY', 'NOTIFICATIONS', 'BILLING')) not null default 'GENERAL', "description" varchar(255) null, "value_type" varchar(255) not null default 'string', constraint "platform_configs_pkey" primary key ("id"));`);
    this.addSql(`alter table "platform_configs" add constraint "platform_configs_key_unique" unique ("key");`);

    this.addSql(`alter table "users" drop constraint "users_tenant_id_foreign";`);

    this.addSql(`alter table "users" add column "is_super_admin" boolean not null default false, add column "is_active" boolean not null default true, add column "last_login_at" timestamptz null;`);
    this.addSql(`alter table "users" alter column "tenant_id" drop default;`);
    this.addSql(`alter table "users" alter column "tenant_id" type uuid using ("tenant_id"::text::uuid);`);
    this.addSql(`alter table "users" alter column "tenant_id" drop not null;`);
    this.addSql(`alter table "users" add constraint "users_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_logs" cascade;`);

    this.addSql(`drop table if exists "platform_configs" cascade;`);

    this.addSql(`alter table "users" drop constraint "users_tenant_id_foreign";`);

    this.addSql(`alter table "users" drop column "is_super_admin", drop column "is_active", drop column "last_login_at";`);

    this.addSql(`alter table "users" alter column "tenant_id" drop default;`);
    this.addSql(`alter table "users" alter column "tenant_id" type uuid using ("tenant_id"::text::uuid);`);
    this.addSql(`alter table "users" alter column "tenant_id" set not null;`);
    this.addSql(`alter table "users" add constraint "users_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
  }

}
