import { Migration } from '@mikro-orm/migrations';

export class Migration20260412222758_Sprint9NotificationRouting extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "notification_routing_configs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "event_code" varchar(255) not null, "recipient_group_id" uuid null, "channels" text[] not null, "is_active" boolean not null default true, "description" text null, constraint "notification_routing_configs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "notification_routing_configs_tenant_id_index" on "notification_routing_configs" ("tenant_id");`,
    );
    this.addSql(
      `create index "notification_routing_configs_event_code_index" on "notification_routing_configs" ("event_code");`,
    );

    this.addSql(
      `alter table "notification_routing_configs" add constraint "notification_routing_configs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "notification_routing_configs" add constraint "notification_routing_configs_recipient_group_id_foreign" foreign key ("recipient_group_id") references "user_groups" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "notifications" add column "channels" text[] not null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "notification_routing_configs" cascade;`);

    this.addSql(`alter table "notifications" drop column "channels";`);
  }
}
