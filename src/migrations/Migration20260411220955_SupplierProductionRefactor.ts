import { Migration } from '@mikro-orm/migrations';

export class Migration20260411220955_SupplierProductionRefactor extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "bom_components" drop constraint "bom_components_bom_id_foreign";`,
    );

    this.addSql(
      `alter table "production_orders" drop constraint "production_orders_bom_id_foreign";`,
    );

    this.addSql(
      `alter table "quality_checks" drop constraint "quality_checks_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_milestones" drop constraint "production_milestones_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_media" drop constraint "production_media_production_order_id_foreign";`,
    );

    this.addSql(
      `create table "supplier_production_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "production_number" varchar(255) not null, "purchase_order_id" uuid not null, "supplier_id" uuid not null, "supplier_contact_id" uuid null, "product_id" uuid null, "variant_id" uuid null, "planned_quantity" numeric(12,2) not null, "produced_quantity" numeric(12,2) not null default 0, "status" text check ("status" in ('AWAITING_START', 'IN_DYEHOUSE', 'IN_WEAVING', 'IN_FINISHING', 'IN_QC', 'READY_TO_SHIP', 'SHIPPED', 'CANCELLED', 'ON_HOLD')) not null default 'AWAITING_START', "factory_location" varchar(255) null, "estimated_start_date" date null, "estimated_completion_date" date null, "actual_start_date" timestamptz null, "actual_completion_date" timestamptz null, "last_supplier_update_at" timestamptz null, "notes" text null, constraint "supplier_production_orders_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "supplier_production_orders_tenant_id_index" on "supplier_production_orders" ("tenant_id");`,
    );
    this.addSql(
      `create index "supplier_production_orders_production_number_index" on "supplier_production_orders" ("production_number");`,
    );
    this.addSql(
      `create index "supplier_production_orders_purchase_order_id_index" on "supplier_production_orders" ("purchase_order_id");`,
    );

    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_purchase_order_id_foreign" foreign key ("purchase_order_id") references "purchase_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_supplier_contact_id_foreign" foreign key ("supplier_contact_id") references "partner_contacts" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "supplier_production_orders" add constraint "supplier_production_orders_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`,
    );

    this.addSql(`drop table if exists "bill_of_materials" cascade;`);

    this.addSql(`drop table if exists "bom_components" cascade;`);

    this.addSql(`drop table if exists "production_orders" cascade;`);

    // Dropping `production_orders` with CASCADE already removes the
    // foreign keys held by `production_milestones`, `production_media`
    // and `quality_checks`. The duplicate "drop constraint" statements
    // emitted by mikro-orm auto-gen are removed here to avoid errors.
    //
    // We still need to drop and re-add `production_media_uploaded_by_id_foreign`
    // explicitly because the column is being made nullable in this migration.
    this.addSql(
      `alter table "production_media" drop constraint if exists "production_media_uploaded_by_id_foreign";`,
    );

    this.addSql(
      `alter table "quality_checks" add column "qc_type" text check ("qc_type" in ('SUPPLIER_PRE_SHIPMENT', 'OUR_INCOMING', 'OUR_RANDOM_AUDIT')) not null default 'SUPPLIER_PRE_SHIPMENT';`,
    );
    this.addSql(
      `alter table "quality_checks" alter column "note" type text using ("note"::text);`,
    );
    this.addSql(
      `alter table "quality_checks" add constraint "quality_checks_production_order_id_foreign" foreign key ("production_order_id") references "supplier_production_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `create index "quality_checks_production_order_id_index" on "quality_checks" ("production_order_id");`,
    );

    this.addSql(`alter table "production_milestones" drop column "cost";`);

    this.addSql(
      `alter table "production_milestones" add column "reported_by_supplier_at" timestamptz null, add column "supplier_media_urls" jsonb null;`,
    );
    this.addSql(
      `alter table "production_milestones" alter column "note" type text using ("note"::text);`,
    );
    this.addSql(
      `alter table "production_milestones" add constraint "production_milestones_production_order_id_foreign" foreign key ("production_order_id") references "supplier_production_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `create index "production_milestones_production_order_id_index" on "production_milestones" ("production_order_id");`,
    );

    this.addSql(
      `alter table "production_media" add column "uploaded_by_supplier" boolean not null default false;`,
    );
    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" drop default;`,
    );
    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" type uuid using ("uploaded_by_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" drop not null;`,
    );
    this.addSql(
      `alter table "production_media" rename column "milestone_name" to "milestone_code";`,
    );
    this.addSql(
      `alter table "production_media" add constraint "production_media_production_order_id_foreign" foreign key ("production_order_id") references "supplier_production_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "production_media" add constraint "production_media_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "production_media_production_order_id_index" on "production_media" ("production_order_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "quality_checks" drop constraint "quality_checks_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_milestones" drop constraint "production_milestones_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_media" drop constraint "production_media_production_order_id_foreign";`,
    );

    this.addSql(
      `create table "bill_of_materials" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "output_product_id" uuid not null, "output_quantity" numeric(10,2) not null default 1, "labor_cost_per_unit" numeric(10,2) not null default 0, "wastage_percent" numeric(5,2) not null default 0, "description" varchar(255) null, "is_active" boolean not null default true, constraint "bill_of_materials_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bill_of_materials_tenant_id_index" on "bill_of_materials" ("tenant_id");`,
    );

    this.addSql(
      `create table "bom_components" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "bom_id" uuid not null, "input_product_id" uuid not null, "quantity" numeric(10,2) not null, "unit" varchar(255) null, "note" varchar(255) null, "sort_order" int not null default 0, constraint "bom_components_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bom_components_tenant_id_index" on "bom_components" ("tenant_id");`,
    );

    this.addSql(
      `create table "production_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "product_id" uuid not null, "variant_id" uuid null, "bom_id" uuid null, "planned_quantity" numeric(10,2) not null, "produced_quantity" numeric(10,2) not null default 0, "status" text check ("status" in ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'QC_PENDING', 'COMPLETED', 'CANCELLED')) not null default 'DRAFT', "planned_start_date" date null, "planned_end_date" date null, "actual_start_date" timestamptz null, "actual_end_date" timestamptz null, "total_cost" numeric(10,2) not null default 0, "note" varchar(255) null, "assigned_to_id" uuid null, "created_by_id" uuid not null, constraint "production_orders_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "production_orders_tenant_id_index" on "production_orders" ("tenant_id");`,
    );

    this.addSql(
      `alter table "bill_of_materials" add constraint "bill_of_materials_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bill_of_materials" add constraint "bill_of_materials_output_product_id_foreign" foreign key ("output_product_id") references "products" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "bom_components" add constraint "bom_components_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bom_components" add constraint "bom_components_bom_id_foreign" foreign key ("bom_id") references "bill_of_materials" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bom_components" add constraint "bom_components_input_product_id_foreign" foreign key ("input_product_id") references "products" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "production_orders" add constraint "production_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "production_orders" add constraint "production_orders_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "production_orders" add constraint "production_orders_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "production_orders" add constraint "production_orders_bom_id_foreign" foreign key ("bom_id") references "bill_of_materials" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "production_orders" add constraint "production_orders_assigned_to_id_foreign" foreign key ("assigned_to_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "production_orders" add constraint "production_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(`drop table if exists "supplier_production_orders" cascade;`);

    this.addSql(
      `alter table "quality_checks" drop constraint "quality_checks_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_milestones" drop constraint "production_milestones_production_order_id_foreign";`,
    );

    this.addSql(
      `alter table "production_media" drop constraint "production_media_production_order_id_foreign";`,
    );
    this.addSql(
      `alter table "production_media" drop constraint "production_media_uploaded_by_id_foreign";`,
    );

    this.addSql(`drop index "quality_checks_production_order_id_index";`);
    this.addSql(`alter table "quality_checks" drop column "qc_type";`);

    this.addSql(
      `alter table "quality_checks" alter column "note" type varchar(255) using ("note"::varchar(255));`,
    );
    this.addSql(
      `alter table "quality_checks" add constraint "quality_checks_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`,
    );

    this.addSql(
      `drop index "production_milestones_production_order_id_index";`,
    );
    this.addSql(
      `alter table "production_milestones" drop column "reported_by_supplier_at", drop column "supplier_media_urls";`,
    );

    this.addSql(
      `alter table "production_milestones" add column "cost" numeric(10,2) not null default 0;`,
    );
    this.addSql(
      `alter table "production_milestones" alter column "note" type varchar(255) using ("note"::varchar(255));`,
    );
    this.addSql(
      `alter table "production_milestones" add constraint "production_milestones_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`,
    );

    this.addSql(`drop index "production_media_production_order_id_index";`);
    this.addSql(
      `alter table "production_media" drop column "uploaded_by_supplier";`,
    );

    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" drop default;`,
    );
    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" type uuid using ("uploaded_by_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "production_media" alter column "uploaded_by_id" set not null;`,
    );
    this.addSql(
      `alter table "production_media" rename column "milestone_code" to "milestone_name";`,
    );
    this.addSql(
      `alter table "production_media" add constraint "production_media_production_order_id_foreign" foreign key ("production_order_id") references "production_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "production_media" add constraint "production_media_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "users" ("id") on update cascade;`,
    );
  }
}
