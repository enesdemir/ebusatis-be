import { Migration } from '@mikro-orm/migrations';

export class Migration20260404191802_wms_inventory extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "goods_receives" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "receive_number" varchar(255) not null, "supplier_id" uuid not null, "warehouse_id" uuid not null, "purchase_order_id" varchar(255) null, "received_at" timestamptz not null, "status" text check ("status" in ('DRAFT', 'COMPLETED', 'CANCELLED')) not null default 'DRAFT', "note" text null, "created_by_id" uuid not null, constraint "goods_receives_pkey" primary key ("id"));`);
    this.addSql(`create index "goods_receives_tenant_id_index" on "goods_receives" ("tenant_id");`);

    this.addSql(`create table "goods_receive_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "goods_receive_id" uuid not null, "variant_id" uuid not null, "expected_quantity" numeric(10,2) null, "received_roll_count" int not null default 0, "total_received_quantity" numeric(10,2) not null default 0, "note" text null, constraint "goods_receive_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "goods_receive_lines_tenant_id_index" on "goods_receive_lines" ("tenant_id");`);

    this.addSql(`alter table "goods_receives" add constraint "goods_receives_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "goods_receives" add constraint "goods_receives_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "goods_receives" add constraint "goods_receives_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade;`);
    this.addSql(`alter table "goods_receives" add constraint "goods_receives_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "goods_receive_lines" add constraint "goods_receive_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "goods_receive_lines" add constraint "goods_receive_lines_goods_receive_id_foreign" foreign key ("goods_receive_id") references "goods_receives" ("id") on update cascade;`);
    this.addSql(`alter table "goods_receive_lines" add constraint "goods_receive_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);

    this.addSql(`alter table "inventory_items" drop constraint if exists "inventory_items_status_check";`);

    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_barcode_unique";`);

    this.addSql(`alter table "inventory_items" add column "reserved_quantity" numeric(10,2) not null default 0, add column "warehouse_id" uuid null, add column "location_id" uuid null, add column "cost_price" numeric(10,2) null, add column "cost_currency_id" uuid null, add column "received_from_id" uuid null, add column "received_at" timestamptz null, add column "expires_at" timestamptz null;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_location_id_foreign" foreign key ("location_id") references "warehouse_locations" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_cost_currency_id_foreign" foreign key ("cost_currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_received_from_id_foreign" foreign key ("received_from_id") references "partners" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_status_check" check("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST', 'WASTE'));`);
    this.addSql(`alter table "inventory_items" rename column "warehouse_location" to "goods_receive_id";`);
    this.addSql(`create index "inventory_items_barcode_index" on "inventory_items" ("barcode");`);
    this.addSql(`create index "inventory_items_batch_code_index" on "inventory_items" ("batch_code");`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_tenant_id_barcode_unique" unique ("tenant_id", "barcode");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "goods_receive_lines" drop constraint "goods_receive_lines_goods_receive_id_foreign";`);

    this.addSql(`drop table if exists "goods_receives" cascade;`);

    this.addSql(`drop table if exists "goods_receive_lines" cascade;`);

    this.addSql(`alter table "inventory_items" drop constraint if exists "inventory_items_status_check";`);

    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_warehouse_id_foreign";`);
    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_location_id_foreign";`);
    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_cost_currency_id_foreign";`);
    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_received_from_id_foreign";`);

    this.addSql(`drop index "inventory_items_barcode_index";`);
    this.addSql(`drop index "inventory_items_batch_code_index";`);
    this.addSql(`alter table "inventory_items" drop constraint "inventory_items_tenant_id_barcode_unique";`);
    this.addSql(`alter table "inventory_items" drop column "reserved_quantity", drop column "warehouse_id", drop column "location_id", drop column "cost_price", drop column "cost_currency_id", drop column "received_from_id", drop column "received_at", drop column "expires_at";`);

    this.addSql(`alter table "inventory_items" add constraint "inventory_items_status_check" check("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST'));`);
    this.addSql(`alter table "inventory_items" rename column "goods_receive_id" to "warehouse_location";`);
    this.addSql(`alter table "inventory_items" add constraint "inventory_items_barcode_unique" unique ("barcode");`);
  }

}
