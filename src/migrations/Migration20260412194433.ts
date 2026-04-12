import { Migration } from '@mikro-orm/migrations';

export class Migration20260412194433 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "inventory_items" drop constraint if exists "inventory_items_status_check";`,
    );

    this.addSql(
      `alter table "product_variants" add column "standard_gsm" numeric(8,2) null, add column "gsm_tolerance" numeric(5,2) not null default 5;`,
    );

    this.addSql(
      `create index "notifications_tenant_id_index" on "notifications" ("tenant_id");`,
    );

    this.addSql(
      `alter table "inventory_items" add column "kartela_number" varchar(255) null, add column "parent_kartela_id" varchar(255) null, add column "shade_group" varchar(255) null, add column "shade_variation" text check ("shade_variation" in ('CS', 'SS', 'NONE')) null, add column "shade_reference" varchar(255) null, add column "actual_gsm" numeric(8,2) null, add column "gsm_variance" numeric(5,2) null;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_status_check" check("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST', 'WASTE', 'FULL', 'PARTIAL', 'ALLOCATED', 'QUARANTINED'));`,
    );
    this.addSql(
      `create index "inventory_items_kartela_number_index" on "inventory_items" ("kartela_number");`,
    );
    this.addSql(
      `create index "inventory_items_parent_kartela_id_index" on "inventory_items" ("parent_kartela_id");`,
    );
    this.addSql(
      `create index "inventory_items_shade_group_index" on "inventory_items" ("shade_group");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "inventory_items" drop constraint if exists "inventory_items_status_check";`,
    );

    this.addSql(
      `alter table "product_variants" drop column "standard_gsm", drop column "gsm_tolerance";`,
    );

    this.addSql(`drop index "notifications_tenant_id_index";`);

    this.addSql(`drop index "inventory_items_kartela_number_index";`);
    this.addSql(`drop index "inventory_items_parent_kartela_id_index";`);
    this.addSql(`drop index "inventory_items_shade_group_index";`);
    this.addSql(
      `alter table "inventory_items" drop column "kartela_number", drop column "parent_kartela_id", drop column "shade_group", drop column "shade_variation", drop column "shade_reference", drop column "actual_gsm", drop column "gsm_variance";`,
    );

    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_status_check" check("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST', 'WASTE'));`,
    );
  }
}
