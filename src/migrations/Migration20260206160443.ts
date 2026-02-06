import { Migration } from '@mikro-orm/migrations';

export class Migration20260206160443 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "products" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "code" varchar(255) null, "description" varchar(255) null, "base_unit" varchar(255) not null default 'Meter', "tenant_id" uuid not null, constraint "products_pkey" primary key ("id"));`);

    this.addSql(`create table "product_variants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "sku" varchar(255) not null, "price" numeric(10,2) not null default 0, "product_id" uuid not null, constraint "product_variants_pkey" primary key ("id"));`);
    this.addSql(`alter table "product_variants" add constraint "product_variants_sku_unique" unique ("sku");`);

    this.addSql(`create table "inventory_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "variant_id" uuid not null, "tenant_id" uuid not null, "barcode" varchar(255) not null, "batch_code" varchar(255) null, "initial_quantity" numeric(10,2) not null, "current_quantity" numeric(10,2) not null, "warehouse_location" varchar(255) null, "status" text check ("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST')) not null default 'IN_STOCK', constraint "inventory_items_pkey" primary key ("id"));`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_barcode_unique" unique ("barcode");`);

    this.addSql(`create table "inventory_transactions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "item_id" uuid not null, "type" text check ("type" in ('PURCHASE', 'SALE_CUT', 'WASTE', 'ADJUSTMENT', 'RETURN')) not null, "quantity_change" numeric(10,2) not null, "previous_quantity" numeric(10,2) not null, "new_quantity" numeric(10,2) not null, "reference_id" varchar(255) null, "note" varchar(255) null, "created_by_id" uuid null, constraint "inventory_transactions_pkey" primary key ("id"));`);

    this.addSql(`alter table "products" add constraint "products_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "product_variants" add constraint "product_variants_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`);

    this.addSql(`alter table "inventory_items" add constraint "inventory_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "inventory_transactions" add constraint "inventory_transactions_item_id_foreign" foreign key ("item_id") references "inventory_items" ("id") on update cascade;`);
    this.addSql(`alter table "inventory_transactions" add constraint "inventory_transactions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "product_variants" drop constraint "product_variants_product_id_foreign";`);

    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_variant_id_foreign";`);

    this.addSql(`alter table "inventory_transactions" drop constraint "inventory_transactions_item_id_foreign";`);

    this.addSql(`drop table if exists "products" cascade;`);

    this.addSql(`drop table if exists "product_variants" cascade;`);

    this.addSql(`drop table if exists "inventory_items" cascade;`);

    this.addSql(`drop table if exists "inventory_transactions" cascade;`);
  }

}
