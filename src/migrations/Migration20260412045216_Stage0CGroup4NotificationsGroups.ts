import { Migration } from '@mikro-orm/migrations';

export class Migration20260412045216_Stage0CGroup4NotificationsGroups extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "notification_templates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "code" varchar(255) not null, "title_i18n_key" varchar(255) not null, "body_i18n_key" varchar(255) not null, "type" text check ("type" in ('ORDER', 'INVENTORY', 'FINANCE', 'PRODUCTION', 'LOGISTICS', 'SYSTEM')) not null, "default_severity" text check ("default_severity" in ('INFO', 'WARNING', 'CRITICAL')) not null default 'INFO', "is_active" boolean not null default true, constraint "notification_templates_pkey" primary key ("id"));`);
    this.addSql(`create index "notification_templates_tenant_id_index" on "notification_templates" ("tenant_id");`);
    this.addSql(`create index "notification_templates_code_index" on "notification_templates" ("code");`);

    this.addSql(`create table "scheduled_notification_triggers" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "template_id" uuid not null, "event" text check ("event" in ('SHIPMENT_ETA_MINUS_X', 'PO_DELIVERY_DATE_MINUS_X', 'INVOICE_OVERDUE_X', 'PRODUCTION_MILESTONE_OVERDUE', 'SAMPLE_RETURN_OVERDUE', 'INVENTORY_COUNT_DUE')) not null, "days_before" int not null, "target_user_ids" jsonb null, "is_active" boolean not null default true, "notes" text null, constraint "scheduled_notification_triggers_pkey" primary key ("id"));`);
    this.addSql(`create index "scheduled_notification_triggers_tenant_id_index" on "scheduled_notification_triggers" ("tenant_id");`);
    this.addSql(`create index "scheduled_notification_triggers_template_id_index" on "scheduled_notification_triggers" ("template_id");`);

    this.addSql(`create table "user_groups" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "type" text check ("type" in ('DEPARTMENT', 'TEAM', 'FUNCTIONAL', 'NOTIFICATION_GROUP')) not null default 'TEAM', "is_active" boolean not null default true, constraint "user_groups_pkey" primary key ("id"));`);
    this.addSql(`create index "user_groups_tenant_id_index" on "user_groups" ("tenant_id");`);
    this.addSql(`create index "user_groups_code_index" on "user_groups" ("code");`);

    this.addSql(`create table "user_groups_members" ("user_group_id" uuid not null, "user_id" uuid not null, constraint "user_groups_members_pkey" primary key ("user_group_id", "user_id"));`);

    this.addSql(`create table "scheduled_notification_triggers_target_groups" ("scheduled_notification_trigger_id" uuid not null, "user_group_id" uuid not null, constraint "scheduled_notification_triggers_target_groups_pkey" primary key ("scheduled_notification_trigger_id", "user_group_id"));`);

    this.addSql(`alter table "notification_templates" add constraint "notification_templates_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "scheduled_notification_triggers" add constraint "scheduled_notification_triggers_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "scheduled_notification_triggers" add constraint "scheduled_notification_triggers_template_id_foreign" foreign key ("template_id") references "notification_templates" ("id") on update cascade;`);

    this.addSql(`alter table "user_groups" add constraint "user_groups_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "user_groups_members" add constraint "user_groups_members_user_group_id_foreign" foreign key ("user_group_id") references "user_groups" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "user_groups_members" add constraint "user_groups_members_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "scheduled_notification_triggers_target_groups" add constraint "scheduled_notification_triggers_target_groups_sc_8e5b0_foreign" foreign key ("scheduled_notification_trigger_id") references "scheduled_notification_triggers" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "scheduled_notification_triggers_target_groups" add constraint "scheduled_notification_triggers_target_groups_us_51a16_foreign" foreign key ("user_group_id") references "user_groups" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "users" add column "full_name" varchar(255) null, add column "phone" varchar(255) null;`);

    this.addSql(`alter table "notifications" add column "scheduled_at" timestamptz null, add column "trigger_event" varchar(255) null, add column "template_id" uuid null, add column "target_group_id" uuid null;`);
    this.addSql(`alter table "notifications" add constraint "notifications_template_id_foreign" foreign key ("template_id") references "notification_templates" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "notifications" add constraint "notifications_target_group_id_foreign" foreign key ("target_group_id") references "user_groups" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "scheduled_notification_triggers" drop constraint "scheduled_notification_triggers_template_id_foreign";`);

    this.addSql(`alter table "notifications" drop constraint "notifications_template_id_foreign";`);

    this.addSql(`alter table "scheduled_notification_triggers_target_groups" drop constraint "scheduled_notification_triggers_target_groups_sc_8e5b0_foreign";`);

    this.addSql(`alter table "user_groups_members" drop constraint "user_groups_members_user_group_id_foreign";`);

    this.addSql(`alter table "scheduled_notification_triggers_target_groups" drop constraint "scheduled_notification_triggers_target_groups_us_51a16_foreign";`);

    this.addSql(`alter table "notifications" drop constraint "notifications_target_group_id_foreign";`);

    this.addSql(`drop table if exists "notification_templates" cascade;`);

    this.addSql(`drop table if exists "scheduled_notification_triggers" cascade;`);

    this.addSql(`drop table if exists "user_groups" cascade;`);

    this.addSql(`drop table if exists "user_groups_members" cascade;`);

    this.addSql(`drop table if exists "scheduled_notification_triggers_target_groups" cascade;`);

    this.addSql(`alter table "users" drop column "full_name", drop column "phone";`);

    this.addSql(`alter table "notifications" drop column "scheduled_at", drop column "trigger_event", drop column "template_id", drop column "target_group_id";`);
  }

}
