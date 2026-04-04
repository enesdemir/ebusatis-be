import { Migration } from '@mikro-orm/migrations';

export class Migration20260404192822_orders extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "purchase_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "supplier_id" uuid not null, "counterparty_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "status_id" uuid null, "expected_delivery_date" date null, "total_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "container_info" jsonb null, "note" text null, "created_by_id" uuid not null, constraint "purchase_orders_pkey" primary key ("id"));`);
    this.addSql(`create index "purchase_orders_tenant_id_index" on "purchase_orders" ("tenant_id");`);
    this.addSql(`create index "purchase_orders_order_number_index" on "purchase_orders" ("order_number");`);

    this.addSql(`create table "purchase_order_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_id" uuid not null, "variant_id" uuid not null, "quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "received_quantity" numeric(10,2) not null default 0, "note" text null, constraint "purchase_order_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "purchase_order_lines_tenant_id_index" on "purchase_order_lines" ("tenant_id");`);

    this.addSql(`create table "sales_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "warehouse_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "status_id" uuid null, "order_date" date not null, "expected_delivery_date" date null, "payment_method_id" uuid null, "delivery_method_id" uuid null, "total_amount" numeric(14,2) not null default 0, "discount_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "note" text null, "internal_note" text null, "assigned_to_id" uuid null, "created_by_id" uuid not null, constraint "sales_orders_pkey" primary key ("id"));`);
    this.addSql(`create index "sales_orders_tenant_id_index" on "sales_orders" ("tenant_id");`);
    this.addSql(`create index "sales_orders_order_number_index" on "sales_orders" ("order_number");`);

    this.addSql(`create table "sales_order_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_id" uuid not null, "line_number" int not null default 1, "variant_id" uuid not null, "requested_quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "discount" numeric(5,2) not null default 0, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "note" text null, constraint "sales_order_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "sales_order_lines_tenant_id_index" on "sales_order_lines" ("tenant_id");`);

    this.addSql(`create table "sales_orders_tags" ("sales_order_id" uuid not null, "tag_id" uuid not null, constraint "sales_orders_tags_pkey" primary key ("sales_order_id", "tag_id"));`);

    this.addSql(`create table "order_roll_allocations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_line_id" uuid not null, "roll_id" uuid not null, "allocated_quantity" numeric(10,2) not null, "status" text check ("status" in ('RESERVED', 'CUT', 'CANCELLED')) not null default 'RESERVED', "cut_at" timestamptz null, constraint "order_roll_allocations_pkey" primary key ("id"));`);
    this.addSql(`create index "order_roll_allocations_tenant_id_index" on "order_roll_allocations" ("tenant_id");`);

    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_status_id_foreign" foreign key ("status_id") references "status_definitions" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "purchase_orders" add constraint "purchase_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "purchase_order_lines" add constraint "purchase_order_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "purchase_order_lines" add constraint "purchase_order_lines_order_id_foreign" foreign key ("order_id") references "purchase_orders" ("id") on update cascade;`);
    this.addSql(`alter table "purchase_order_lines" add constraint "purchase_order_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);
    this.addSql(`alter table "purchase_order_lines" add constraint "purchase_order_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "sales_orders" add constraint "sales_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_status_id_foreign" foreign key ("status_id") references "status_definitions" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_payment_method_id_foreign" foreign key ("payment_method_id") references "payment_methods" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_delivery_method_id_foreign" foreign key ("delivery_method_id") references "delivery_methods" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_assigned_to_id_foreign" foreign key ("assigned_to_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "sales_orders" add constraint "sales_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "sales_order_lines" add constraint "sales_order_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "sales_order_lines" add constraint "sales_order_lines_order_id_foreign" foreign key ("order_id") references "sales_orders" ("id") on update cascade;`);
    this.addSql(`alter table "sales_order_lines" add constraint "sales_order_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);
    this.addSql(`alter table "sales_order_lines" add constraint "sales_order_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "sales_orders_tags" add constraint "sales_orders_tags_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "sales_orders_tags" add constraint "sales_orders_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "order_roll_allocations" add constraint "order_roll_allocations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "order_roll_allocations" add constraint "order_roll_allocations_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade;`);
    this.addSql(`alter table "order_roll_allocations" add constraint "order_roll_allocations_roll_id_foreign" foreign key ("roll_id") references "inventory_items" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "purchase_order_lines" drop constraint "purchase_order_lines_order_id_foreign";`);

    this.addSql(`alter table "sales_order_lines" drop constraint "sales_order_lines_order_id_foreign";`);

    this.addSql(`alter table "sales_orders_tags" drop constraint "sales_orders_tags_sales_order_id_foreign";`);

    this.addSql(`alter table "order_roll_allocations" drop constraint "order_roll_allocations_order_line_id_foreign";`);

    this.addSql(`drop table if exists "purchase_orders" cascade;`);

    this.addSql(`drop table if exists "purchase_order_lines" cascade;`);

    this.addSql(`drop table if exists "sales_orders" cascade;`);

    this.addSql(`drop table if exists "sales_order_lines" cascade;`);

    this.addSql(`drop table if exists "sales_orders_tags" cascade;`);

    this.addSql(`drop table if exists "order_roll_allocations" cascade;`);
  }

}
