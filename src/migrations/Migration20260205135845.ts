import { Migration } from '@mikro-orm/migrations';

export class Migration20260205135845 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "permissions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "slug" varchar(255) not null, "category" varchar(255) not null, "description" varchar(255) null, constraint "permissions_pkey" primary key ("id"));`);
    this.addSql(`alter table "permissions" add constraint "permissions_slug_unique" unique ("slug");`);

    this.addSql(`create table "tenants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "domain" varchar(255) not null, "type" text check ("type" in ('SAAS', 'ON_PREM_LICENSE')) not null default 'SAAS', "subscription_status" text check ("subscription_status" in ('ACTIVE', 'SUSPENDED', 'TRIAL')) not null default 'ACTIVE', constraint "tenants_pkey" primary key ("id"));`);
    this.addSql(`alter table "tenants" add constraint "tenants_domain_unique" unique ("domain");`);

    this.addSql(`create table "roles" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "is_system_role" boolean not null default false, "tenant_id" uuid null, constraint "roles_pkey" primary key ("id"));`);

    this.addSql(`create table "roles_permissions" ("role_id" uuid not null, "permission_id" uuid not null, constraint "roles_permissions_pkey" primary key ("role_id", "permission_id"));`);

    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "is_tenant_owner" boolean not null default false, "tenant_id" uuid not null, constraint "users_pkey" primary key ("id"));`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "users_roles" ("user_id" uuid not null, "role_id" uuid not null, constraint "users_roles_pkey" primary key ("user_id", "role_id"));`);

    this.addSql(`alter table "roles" add constraint "roles_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "roles_permissions" add constraint "roles_permissions_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "roles_permissions" add constraint "roles_permissions_permission_id_foreign" foreign key ("permission_id") references "permissions" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "users" add constraint "users_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "users_roles" add constraint "users_roles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "users_roles" add constraint "users_roles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "roles_permissions" drop constraint "roles_permissions_permission_id_foreign";`);

    this.addSql(`alter table "roles" drop constraint "roles_tenant_id_foreign";`);

    this.addSql(`alter table "users" drop constraint "users_tenant_id_foreign";`);

    this.addSql(`alter table "roles_permissions" drop constraint "roles_permissions_role_id_foreign";`);

    this.addSql(`alter table "users_roles" drop constraint "users_roles_role_id_foreign";`);

    this.addSql(`alter table "users_roles" drop constraint "users_roles_user_id_foreign";`);

    this.addSql(`drop table if exists "permissions" cascade;`);

    this.addSql(`drop table if exists "tenants" cascade;`);

    this.addSql(`drop table if exists "roles" cascade;`);

    this.addSql(`drop table if exists "roles_permissions" cascade;`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "users_roles" cascade;`);
  }

}
