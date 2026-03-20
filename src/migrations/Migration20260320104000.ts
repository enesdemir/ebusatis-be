import { Migration } from '@mikro-orm/migrations';

export class Migration20260320104000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "menu_nodes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "code" varchar(255) not null, "label" varchar(255) not null, "icon" varchar(255) null, "path" varchar(255) null, "sort_order" int not null default 0, "scope" text check ("scope" in ('PLATFORM', 'TENANT', 'BOTH')) not null default 'TENANT', "required_permission" varchar(255) null, "has_divider" boolean not null default false, "is_active" boolean not null default true, "parent_id" uuid null, constraint "menu_nodes_pkey" primary key ("id"));`);
    this.addSql(`alter table "menu_nodes" add constraint "menu_nodes_code_unique" unique ("code");`);
    this.addSql(`alter table "menu_nodes" add constraint "menu_nodes_parent_id_foreign" foreign key ("parent_id") references "menu_nodes" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "menu_nodes" cascade;`);
  }

}
