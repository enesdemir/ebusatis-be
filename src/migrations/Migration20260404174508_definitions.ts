import { Migration } from '@mikro-orm/migrations';

export class Migration20260404174508_definitions extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "tax_rates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "rate" numeric(5,2) not null, "type" text check ("type" in ('VAT', 'WITHHOLDING', 'CUSTOMS', 'EXEMPT')) not null default 'VAT', "is_default" boolean not null default false, "is_inclusive" boolean not null default false, constraint "tax_rates_pkey" primary key ("id"));`);
    this.addSql(`create index "tax_rates_tenant_id_index" on "tax_rates" ("tenant_id");`);
    this.addSql(`alter table "tax_rates" add constraint "tax_rates_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "tags" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "color" varchar(255) not null, "icon" varchar(255) null, "entity_types" jsonb not null default '[]', constraint "tags_pkey" primary key ("id"));`);
    this.addSql(`create index "tags_tenant_id_index" on "tags" ("tenant_id");`);
    this.addSql(`alter table "tags" add constraint "tags_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "status_definitions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "entity_type" text check ("entity_type" in ('ORDER', 'INVOICE', 'PURCHASE', 'PRODUCTION', 'SHIPMENT')) not null, "color" varchar(255) not null, "icon" varchar(255) null, "is_final" boolean not null default false, "is_default" boolean not null default false, "allowed_transitions" jsonb not null default '[]', constraint "status_definitions_pkey" primary key ("id"));`);
    this.addSql(`create index "status_definitions_tenant_id_index" on "status_definitions" ("tenant_id");`);
    this.addSql(`alter table "status_definitions" add constraint "status_definitions_tenant_id_code_entity_type_unique" unique ("tenant_id", "code", "entity_type");`);

    this.addSql(`create table "payment_methods" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "type" text check ("type" in ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'DEFERRED', 'OFFSET')) not null, "icon" varchar(255) null, "requires_reference" boolean not null default false, "default_due_days" int null, constraint "payment_methods_pkey" primary key ("id"));`);
    this.addSql(`create index "payment_methods_tenant_id_index" on "payment_methods" ("tenant_id");`);
    this.addSql(`alter table "payment_methods" add constraint "payment_methods_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "delivery_methods" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "type" text check ("type" in ('CARGO', 'PICKUP', 'OWN_VEHICLE', 'COURIER', 'FREIGHT')) not null, "icon" varchar(255) null, "default_cost" numeric(10,2) null, "estimated_days" int null, constraint "delivery_methods_pkey" primary key ("id"));`);
    this.addSql(`create index "delivery_methods_tenant_id_index" on "delivery_methods" ("tenant_id");`);
    this.addSql(`alter table "delivery_methods" add constraint "delivery_methods_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "currencies" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "symbol" varchar(255) not null, "decimal_places" int not null default 2, "is_default" boolean not null default false, "position" text check ("position" in ('PREFIX', 'SUFFIX')) not null default 'SUFFIX', constraint "currencies_pkey" primary key ("id"));`);
    this.addSql(`create index "currencies_tenant_id_index" on "currencies" ("tenant_id");`);
    this.addSql(`alter table "currencies" add constraint "currencies_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "exchange_rates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "from_currency_id" uuid not null, "to_currency_id" uuid not null, "rate" numeric(18,6) not null, "effective_date" date not null, "source" text check ("source" in ('MANUAL', 'API')) not null default 'MANUAL', constraint "exchange_rates_pkey" primary key ("id"));`);
    this.addSql(`create index "exchange_rates_tenant_id_index" on "exchange_rates" ("tenant_id");`);

    this.addSql(`create table "categories" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "parent_id" uuid null, "icon" varchar(255) null, "color" varchar(255) null, "depth" int not null default 0, constraint "categories_pkey" primary key ("id"));`);
    this.addSql(`create index "categories_tenant_id_index" on "categories" ("tenant_id");`);
    this.addSql(`alter table "categories" add constraint "categories_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "units_of_measure" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "category" text check ("category" in ('LENGTH', 'WEIGHT', 'AREA', 'PIECE', 'VOLUME')) not null, "symbol" varchar(255) not null, "base_conversion_factor" numeric(10,6) not null default 1, "decimal_precision" int not null default 2, "is_base_unit" boolean not null default false, constraint "units_of_measure_pkey" primary key ("id"));`);
    this.addSql(`create index "units_of_measure_tenant_id_index" on "units_of_measure" ("tenant_id");`);
    this.addSql(`alter table "units_of_measure" add constraint "units_of_measure_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "warehouses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "address" varchar(255) null, "city" varchar(255) null, "country" varchar(255) null, "type" text check ("type" in ('MAIN', 'TRANSIT', 'RETURN', 'PRODUCTION', 'CONSIGNMENT')) not null default 'MAIN', "is_default" boolean not null default false, "legal_entity" varchar(255) null, "manager_id" uuid null, constraint "warehouses_pkey" primary key ("id"));`);
    this.addSql(`create index "warehouses_tenant_id_index" on "warehouses" ("tenant_id");`);
    this.addSql(`alter table "warehouses" add constraint "warehouses_tenant_id_code_unique" unique ("tenant_id", "code");`);

    this.addSql(`create table "warehouse_locations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "warehouse_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "type" text check ("type" in ('ZONE', 'AISLE', 'SHELF', 'BIN', 'FLOOR')) not null default 'SHELF', "parent_id" uuid null, "capacity" jsonb null, "is_active" boolean not null default true, "sort_order" int not null default 0, constraint "warehouse_locations_pkey" primary key ("id"));`);
    this.addSql(`create index "warehouse_locations_tenant_id_index" on "warehouse_locations" ("tenant_id");`);
    this.addSql(`alter table "warehouse_locations" add constraint "warehouse_locations_warehouse_id_code_unique" unique ("warehouse_id", "code");`);

    this.addSql(`alter table "tax_rates" add constraint "tax_rates_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "tags" add constraint "tags_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "status_definitions" add constraint "status_definitions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "payment_methods" add constraint "payment_methods_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "delivery_methods" add constraint "delivery_methods_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "currencies" add constraint "currencies_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "exchange_rates" add constraint "exchange_rates_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "exchange_rates" add constraint "exchange_rates_from_currency_id_foreign" foreign key ("from_currency_id") references "currencies" ("id") on update cascade;`);
    this.addSql(`alter table "exchange_rates" add constraint "exchange_rates_to_currency_id_foreign" foreign key ("to_currency_id") references "currencies" ("id") on update cascade;`);

    this.addSql(`alter table "categories" add constraint "categories_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "categories" add constraint "categories_parent_id_foreign" foreign key ("parent_id") references "categories" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "units_of_measure" add constraint "units_of_measure_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "warehouses" add constraint "warehouses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "warehouses" add constraint "warehouses_manager_id_foreign" foreign key ("manager_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "warehouse_locations" add constraint "warehouse_locations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "warehouse_locations" add constraint "warehouse_locations_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade;`);
    this.addSql(`alter table "warehouse_locations" add constraint "warehouse_locations_parent_id_foreign" foreign key ("parent_id") references "warehouse_locations" ("id") on update cascade on delete set null;`);

    this.addSql(`create index "products_tenant_id_index" on "products" ("tenant_id");`);

    this.addSql(`create index "inventory_items_tenant_id_index" on "inventory_items" ("tenant_id");`);

    this.addSql(`create index "attributes_tenant_id_index" on "attributes" ("tenant_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "exchange_rates" drop constraint "exchange_rates_from_currency_id_foreign";`);

    this.addSql(`alter table "exchange_rates" drop constraint "exchange_rates_to_currency_id_foreign";`);

    this.addSql(`alter table "categories" drop constraint "categories_parent_id_foreign";`);

    this.addSql(`alter table "warehouse_locations" drop constraint "warehouse_locations_warehouse_id_foreign";`);

    this.addSql(`alter table "warehouse_locations" drop constraint "warehouse_locations_parent_id_foreign";`);

    this.addSql(`drop table if exists "tax_rates" cascade;`);

    this.addSql(`drop table if exists "tags" cascade;`);

    this.addSql(`drop table if exists "status_definitions" cascade;`);

    this.addSql(`drop table if exists "payment_methods" cascade;`);

    this.addSql(`drop table if exists "delivery_methods" cascade;`);

    this.addSql(`drop table if exists "currencies" cascade;`);

    this.addSql(`drop table if exists "exchange_rates" cascade;`);

    this.addSql(`drop table if exists "categories" cascade;`);

    this.addSql(`drop table if exists "units_of_measure" cascade;`);

    this.addSql(`drop table if exists "warehouses" cascade;`);

    this.addSql(`drop table if exists "warehouse_locations" cascade;`);

    this.addSql(`drop index "products_tenant_id_index";`);

    this.addSql(`drop index "inventory_items_tenant_id_index";`);

    this.addSql(`drop index "attributes_tenant_id_index";`);
  }

}
