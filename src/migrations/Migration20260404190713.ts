import { Migration } from '@mikro-orm/migrations';

export class Migration20260404190713 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "supplier_price_lists" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "supplier_id" uuid not null, "name" varchar(255) not null, "currency_id" uuid null, "valid_from" date null, "valid_to" date null, "is_active" boolean not null default true, constraint "supplier_price_lists_pkey" primary key ("id"));`);
    this.addSql(`create index "supplier_price_lists_tenant_id_index" on "supplier_price_lists" ("tenant_id");`);

    this.addSql(`create table "supplier_price_list_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "price_list_id" uuid not null, "variant_id" uuid not null, "unit_price" numeric(10,2) not null, "moq" numeric(10,2) null, "lead_time_days" int null, "note" text null, constraint "supplier_price_list_items_pkey" primary key ("id"));`);
    this.addSql(`create index "supplier_price_list_items_tenant_id_index" on "supplier_price_list_items" ("tenant_id");`);

    this.addSql(`create table "products_tags" ("product_id" uuid not null, "tag_id" uuid not null, constraint "products_tags_pkey" primary key ("product_id", "tag_id"));`);

    this.addSql(`create table "digital_catalogs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "title" varchar(255) not null, "token" varchar(255) not null, "show_prices" boolean not null default true, "show_stock" boolean not null default false, "expires_at" timestamptz null, "view_count" int not null default 0, "is_active" boolean not null default true, "created_by_id" uuid not null, "partner_id" varchar(255) null, constraint "digital_catalogs_pkey" primary key ("id"));`);
    this.addSql(`create index "digital_catalogs_tenant_id_index" on "digital_catalogs" ("tenant_id");`);
    this.addSql(`alter table "digital_catalogs" add constraint "digital_catalogs_token_unique" unique ("token");`);

    this.addSql(`create table "digital_catalog_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "catalog_id" uuid not null, "variant_id" uuid not null, "custom_price" numeric(10,2) null, "note" text null, "sort_order" int not null default 0, constraint "digital_catalog_items_pkey" primary key ("id"));`);
    this.addSql(`create index "digital_catalog_items_tenant_id_index" on "digital_catalog_items" ("tenant_id");`);

    this.addSql(`alter table "supplier_price_lists" add constraint "supplier_price_lists_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "supplier_price_lists" add constraint "supplier_price_lists_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "supplier_price_lists" add constraint "supplier_price_lists_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "supplier_price_list_items" add constraint "supplier_price_list_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "supplier_price_list_items" add constraint "supplier_price_list_items_price_list_id_foreign" foreign key ("price_list_id") references "supplier_price_lists" ("id") on update cascade;`);
    this.addSql(`alter table "supplier_price_list_items" add constraint "supplier_price_list_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);

    this.addSql(`alter table "products_tags" add constraint "products_tags_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "products_tags" add constraint "products_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "digital_catalogs" add constraint "digital_catalogs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "digital_catalogs" add constraint "digital_catalogs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "digital_catalog_items" add constraint "digital_catalog_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "digital_catalog_items" add constraint "digital_catalog_items_catalog_id_foreign" foreign key ("catalog_id") references "digital_catalogs" ("id") on update cascade;`);
    this.addSql(`alter table "digital_catalog_items" add constraint "digital_catalog_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);

    this.addSql(`alter table "products" drop column "base_unit";`);

    this.addSql(`alter table "products" add column "category_id" uuid null, add column "unit_id" uuid null, add column "tax_rate_id" uuid null, add column "tracking_strategy" text check ("tracking_strategy" in ('SERIAL', 'BULK')) not null default 'SERIAL', add column "fabric_composition" varchar(255) null, add column "washing_instructions" varchar(255) null, add column "collection_name" varchar(255) null, add column "moq" numeric(10,2) null, add column "origin" varchar(255) null, add column "is_active" boolean not null default true;`);
    this.addSql(`alter table "products" alter column "description" type text using ("description"::text);`);
    this.addSql(`alter table "products" add constraint "products_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "products" add constraint "products_unit_id_foreign" foreign key ("unit_id") references "units_of_measure" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "products" add constraint "products_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "products_code_index" on "products" ("code");`);

    this.addSql(`alter table "product_variants" drop constraint "product_variants_sku_unique";`);

    this.addSql(`alter table "product_variants" add column "tenant_id" uuid not null, add column "cost_price" numeric(10,2) null, add column "currency_id" uuid null, add column "min_order_quantity" numeric(10,2) null, add column "color_code" varchar(255) null, add column "width" numeric(10,2) null, add column "weight" numeric(10,2) null, add column "martindale" int null, add column "primary_image_url" varchar(255) null, add column "barcode" varchar(255) null, add column "is_active" boolean not null default true;`);
    this.addSql(`alter table "product_variants" add constraint "product_variants_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "product_variants" add constraint "product_variants_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "product_variants_tenant_id_index" on "product_variants" ("tenant_id");`);
    this.addSql(`create index "product_variants_sku_index" on "product_variants" ("sku");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "supplier_price_list_items" drop constraint "supplier_price_list_items_price_list_id_foreign";`);

    this.addSql(`alter table "digital_catalog_items" drop constraint "digital_catalog_items_catalog_id_foreign";`);

    this.addSql(`drop table if exists "supplier_price_lists" cascade;`);

    this.addSql(`drop table if exists "supplier_price_list_items" cascade;`);

    this.addSql(`drop table if exists "products_tags" cascade;`);

    this.addSql(`drop table if exists "digital_catalogs" cascade;`);

    this.addSql(`drop table if exists "digital_catalog_items" cascade;`);

    this.addSql(`alter table "products" drop constraint "products_category_id_foreign";`);
    this.addSql(`alter table "products" drop constraint "products_unit_id_foreign";`);
    this.addSql(`alter table "products" drop constraint "products_tax_rate_id_foreign";`);

    this.addSql(`alter table "product_variants" drop constraint "product_variants_tenant_id_foreign";`);
    this.addSql(`alter table "product_variants" drop constraint "product_variants_currency_id_foreign";`);

    this.addSql(`drop index "products_code_index";`);
    this.addSql(`alter table "products" drop column "category_id", drop column "unit_id", drop column "tax_rate_id", drop column "tracking_strategy", drop column "fabric_composition", drop column "washing_instructions", drop column "collection_name", drop column "moq", drop column "origin", drop column "is_active";`);

    this.addSql(`alter table "products" add column "base_unit" varchar(255) not null default 'Meter';`);
    this.addSql(`alter table "products" alter column "description" type varchar(255) using ("description"::varchar(255));`);

    this.addSql(`drop index "product_variants_tenant_id_index";`);
    this.addSql(`drop index "product_variants_sku_index";`);
    this.addSql(`alter table "product_variants" drop column "tenant_id", drop column "cost_price", drop column "currency_id", drop column "min_order_quantity", drop column "color_code", drop column "width", drop column "weight", drop column "martindale", drop column "primary_image_url", drop column "barcode", drop column "is_active";`);

    this.addSql(`alter table "product_variants" add constraint "product_variants_sku_unique" unique ("sku");`);
  }

}
