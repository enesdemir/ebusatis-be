import { Migration } from '@mikro-orm/migrations';

/**
 * Classification modulu icin eksik kalan tablo migration'i.
 *
 * 694f2a5 commit'inde ClassificationNode entity'si eklendi fakat migration
 * dosyasi commit edilmemis. Snapshot guncellenmis ama tablo yaratan SQL
 * yoktu — bu yuzden Migration20260409120000 (partner_addresses FK ekleyen)
 * "relation classification_nodes does not exist" hatasiyla patliyordu.
 *
 * Bu migration timestamp olarak 20260408151932 (Uretim Modulu) ile
 * 20260409120000 (PartnerAddress FK) arasinda calisir.
 */
export class Migration20260408160000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "classification_nodes" (
      "id" uuid not null,
      "created_at" timestamptz(6) not null,
      "updated_at" timestamptz(6) not null,
      "deleted_at" timestamptz(6) null,
      "tenant_id" uuid null,
      "classification_type" varchar(50) not null,
      "module" varchar(50) not null,
      "parent_id" uuid null,
      "path" varchar(1000) not null default '',
      "depth" int not null default 0,
      "code" varchar(100) not null,
      "key" uuid not null,
      "names" jsonb not null,
      "descriptions" jsonb null,
      "properties" jsonb null,
      "tags" text[] null,
      "icon" varchar(50) null,
      "color" varchar(20) null,
      "is_root" boolean not null default false,
      "is_system" boolean not null default false,
      "is_active" boolean not null default true,
      "selectable" boolean not null default true,
      "sort_order" int not null default 0,
      constraint "classification_nodes_pkey" primary key ("id")
    );`);

    this.addSql(`create index "classification_nodes_tenant_id_index" on "classification_nodes" ("tenant_id");`);
    this.addSql(`create index "idx_classification_type" on "classification_nodes" ("classification_type");`);
    this.addSql(`create index "idx_classification_tenant_type" on "classification_nodes" ("tenant_id", "classification_type");`);
    this.addSql(`create index "idx_classification_path" on "classification_nodes" ("path");`);
    this.addSql(`create index "idx_classification_module" on "classification_nodes" ("module");`);
    this.addSql(`alter table "classification_nodes" add constraint "uq_classification_tenant_type_code" unique ("tenant_id", "classification_type", "code");`);

    this.addSql(`alter table "classification_nodes" add constraint "classification_nodes_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "classification_nodes" add constraint "classification_nodes_parent_id_foreign" foreign key ("parent_id") references "classification_nodes" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "classification_nodes" cascade;`);
  }
}
