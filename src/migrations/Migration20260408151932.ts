import { Migration } from '@mikro-orm/migrations';

export class Migration20260408151932 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "bill_of_materials" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "output_product_id" uuid not null, "output_quantity" numeric(10,2) not null default 1, "labor_cost_per_unit" numeric(10,2) not null default 0, "wastage_percent" numeric(5,2) not null default 0, "description" varchar(255) null, "is_active" boolean not null default true, constraint "bill_of_materials_pkey" primary key ("id"));`);
    this.addSql(`create index "bill_of_materials_tenant_id_index" on "bill_of_materials" ("tenant_id");`);

    this.addSql(`create table "bom_components" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "bom_id" uuid not null, "input_product_id" uuid not null, "quantity" numeric(10,2) not null, "unit" varchar(255) null, "note" varchar(255) null, "sort_order" int not null default 0, constraint "bom_components_pkey" primary key ("id"));`);
    this.addSql(`create index "bom_components_tenant_id_index" on "bom_components" ("tenant_id");`);

    this.addSql(`create table "production_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "product_id" uuid not null, "variant_id" uuid null, "bom_id" uuid null, "planned_quantity" numeric(10,2) not null, "produced_quantity" numeric(10,2) not null default 0, "status" text check ("status" in ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'QC_PENDING', 'COMPLETED', 'CANCELLED')) not null default 'DRAFT', "planned_start_date" date null, "planned_end_date" date null, "actual_start_date" timestamptz null, "actual_end_date" timestamptz null, "total_cost" numeric(10,2) not null default 0, "note" varchar(255) null, "assigned_to_id" uuid null, "created_by_id" uuid not null, constraint "production_orders_pkey" primary key ("id"));`);
    this.addSql(`create index "production_orders_tenant_id_index" on "production_orders" ("tenant_id");`);

    this.addSql(`create table "quality_checks" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "production_order_id" uuid not null, "test_type" varchar(255) not null, "test_standard" varchar(255) null, "result" text check ("result" in ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL')) not null default 'PENDING', "measured_value" varchar(255) null, "expected_value" varchar(255) null, "tested_at" timestamptz null, "inspector_id" uuid null, "note" varchar(255) null, "attachments" jsonb null, constraint "quality_checks_pkey" primary key ("id"));`);
    this.addSql(`create index "quality_checks_tenant_id_index" on "quality_checks" ("tenant_id");`);

    this.addSql(`create table "production_milestones" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "production_order_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "status" text check ("status" in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')) not null default 'PENDING', "sort_order" int not null default 0, "started_at" timestamptz null, "completed_at" timestamptz null, "note" varchar(255) null, "assigned_to_id" uuid null, "cost" numeric(10,2) not null default 0, constraint "production_milestones_pkey" primary key ("id"));`);
    this.addSql(`create index "production_milestones_tenant_id_index" on "production_milestones" ("tenant_id");`);

    this.addSql(`create table "production_media" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "production_order_id" uuid not null, "type" text check ("type" in ('PHOTO', 'VIDEO', 'DOCUMENT')) not null default 'PHOTO', "file_name" varchar(255) not null, "file_url" varchar(255) not null, "description" varchar(255) null, "milestone_name" varchar(255) null, "uploaded_by_id" uuid not null, constraint "production_media_pkey" primary key ("id"));`);
    this.addSql(`create index "production_media_tenant_id_index" on "production_media" ("tenant_id");`);

    this.addSql(`alter table "bill_of_materials" add constraint "bill_of_materials_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "bill_of_materials" add constraint "bill_of_materials_output_product_id_foreign" foreign key ("output_product_id") references "products" ("id") on update cascade;`);

    this.addSql(`alter table "bom_components" add constraint "bom_components_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "bom_components" add constraint "bom_components_bom_id_foreign" foreign key ("bom_id") references "bill_of_materials" ("id") on update cascade;`);
    this.addSql(`alter table "bom_components" add constraint "bom_components_input_product_id_foreign" foreign key ("input_product_id") references "products" ("id") on update cascade;`);

    this.addSql(`alter table "production_orders" add constraint "production_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "production_orders" add constraint "production_orders_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`);
    this.addSql(`alter table "production_orders" add constraint "production_orders_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "production_orders" add constraint "production_orders_bom_id_foreign" foreign key ("bom_id") references "bill_of_materials" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "production_orders" add constraint "production_orders_assigned_to_id_foreign" foreign key ("assigned_to_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "production_orders" add constraint "production_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "quality_checks" add constraint "quality_checks_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "quality_checks" add constraint "quality_checks_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`);
    this.addSql(`alter table "quality_checks" add constraint "quality_checks_inspector_id_foreign" foreign key ("inspector_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "production_milestones" add constraint "production_milestones_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "production_milestones" add constraint "production_milestones_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`);
    this.addSql(`alter table "production_milestones" add constraint "production_milestones_assigned_to_id_foreign" foreign key ("assigned_to_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "production_media" add constraint "production_media_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "production_media" add constraint "production_media_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`);
    this.addSql(`alter table "production_media" add constraint "production_media_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bom_components" drop constraint "bom_components_bom_id_foreign";`);

    this.addSql(`alter table "production_orders" drop constraint "production_orders_bom_id_foreign";`);

    this.addSql(`alter table "quality_checks" drop constraint "quality_checks_production_order_id_foreign";`);

    this.addSql(`alter table "production_milestones" drop constraint "production_milestones_production_order_id_foreign";`);

    this.addSql(`alter table "production_media" drop constraint "production_media_production_order_id_foreign";`);

    this.addSql(`drop table if exists "bill_of_materials" cascade;`);

    this.addSql(`drop table if exists "bom_components" cascade;`);

    this.addSql(`drop table if exists "production_orders" cascade;`);

    this.addSql(`drop table if exists "quality_checks" cascade;`);

    this.addSql(`drop table if exists "production_milestones" cascade;`);

    this.addSql(`drop table if exists "production_media" cascade;`);
  }

}
