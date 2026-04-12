import { Migration } from '@mikro-orm/migrations';

export class Migration20260412044510_Stage0CGroup3ProductsCollectionsSamples extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "product_collections" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "type" text check ("type" in ('SEASONAL', 'THEMED', 'CAMPAIGN', 'PERMANENT')) not null default 'SEASONAL', "season" varchar(255) null, "launch_date" date null, "end_date" date null, "is_active" boolean not null default true, "cover_image_url" varchar(255) null, constraint "product_collections_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "product_collections_tenant_id_index" on "product_collections" ("tenant_id");`,
    );
    this.addSql(
      `create index "product_collections_code_index" on "product_collections" ("code");`,
    );

    this.addSql(
      `create table "product_collections_products" ("product_collection_id" uuid not null, "product_id" uuid not null, constraint "product_collections_products_pkey" primary key ("product_collection_id", "product_id"));`,
    );

    this.addSql(
      `create table "physical_samples" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "sample_code" varchar(255) not null, "product_id" uuid not null, "variant_id" uuid null, "type" text check ("type" in ('SWATCH', 'CUTTING', 'FULL_ROLL', 'HANGER')) not null default 'SWATCH', "status" text check ("status" in ('IN_STOCK', 'LENT', 'RETURNED', 'LOST', 'DESTROYED')) not null default 'IN_STOCK', "current_warehouse_id" uuid null, "current_holder_id" uuid null, "current_holder_user_id" uuid null, "notes" text null, constraint "physical_samples_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "physical_samples_tenant_id_index" on "physical_samples" ("tenant_id");`,
    );
    this.addSql(
      `create index "physical_samples_sample_code_index" on "physical_samples" ("sample_code");`,
    );

    this.addSql(
      `create table "sample_loan_history" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "sample_id" uuid not null, "lent_to_partner_id" uuid null, "lent_to_user_id" uuid null, "lent_at" timestamptz not null, "expected_return_date" date null, "returned_at" timestamptz null, "lent_by_user_id" uuid null, "returned_by_user_id" uuid null, "notes" text null, constraint "sample_loan_history_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "sample_loan_history_tenant_id_index" on "sample_loan_history" ("tenant_id");`,
    );
    this.addSql(
      `create index "sample_loan_history_sample_id_index" on "sample_loan_history" ("sample_id");`,
    );

    this.addSql(
      `create table "inventory_counts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "count_number" varchar(255) not null, "warehouse_id" uuid not null, "type" text check ("type" in ('CYCLE', 'ANNUAL', 'SPOT', 'INITIAL')) not null default 'CYCLE', "status" text check ("status" in ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'RECONCILED')) not null default 'DRAFT', "started_at" timestamptz null, "completed_at" timestamptz null, "created_by_id" uuid not null, "notes" text null, constraint "inventory_counts_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "inventory_counts_tenant_id_index" on "inventory_counts" ("tenant_id");`,
    );
    this.addSql(
      `create index "inventory_counts_count_number_index" on "inventory_counts" ("count_number");`,
    );

    this.addSql(
      `create table "inventory_count_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "count_id" uuid not null, "item_id" uuid not null, "expected_quantity" numeric(12,2) not null, "actual_quantity" numeric(12,2) not null, "variance" numeric(12,2) not null, "notes" text null, constraint "inventory_count_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "inventory_count_lines_tenant_id_index" on "inventory_count_lines" ("tenant_id");`,
    );
    this.addSql(
      `create index "inventory_count_lines_count_id_index" on "inventory_count_lines" ("count_id");`,
    );

    this.addSql(
      `alter table "product_collections" add constraint "product_collections_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "product_collections_products" add constraint "product_collections_products_product_collection_id_foreign" foreign key ("product_collection_id") references "product_collections" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "product_collections_products" add constraint "product_collections_products_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_current_warehouse_id_foreign" foreign key ("current_warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_current_holder_id_foreign" foreign key ("current_holder_id") references "partners" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "physical_samples" add constraint "physical_samples_current_holder_user_id_foreign" foreign key ("current_holder_user_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_sample_id_foreign" foreign key ("sample_id") references "physical_samples" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_lent_to_partner_id_foreign" foreign key ("lent_to_partner_id") references "partners" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_lent_to_user_id_foreign" foreign key ("lent_to_user_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_lent_by_user_id_foreign" foreign key ("lent_by_user_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sample_loan_history" add constraint "sample_loan_history_returned_by_user_id_foreign" foreign key ("returned_by_user_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "inventory_counts" add constraint "inventory_counts_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_counts" add constraint "inventory_counts_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_counts" add constraint "inventory_counts_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "inventory_count_lines" add constraint "inventory_count_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_count_lines" add constraint "inventory_count_lines_count_id_foreign" foreign key ("count_id") references "inventory_counts" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_count_lines" add constraint "inventory_count_lines_item_id_foreign" foreign key ("item_id") references "inventory_items" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "warehouses" drop constraint if exists "warehouses_type_check";`,
    );

    this.addSql(
      `alter table "partners" add column "customer_subtype" text check ("customer_subtype" in ('DEALER', 'WHOLESALE', 'RETAIL', 'B2B', 'SHOWROOM', 'ONLINE')) null, add column "supplier_subtype" text check ("supplier_subtype" in ('FABRIC_FACTORY', 'RAW_MATERIAL', 'PACKAGING', 'LOGISTICS_PROVIDER')) null;`,
    );

    this.addSql(
      `alter table "product_variants" add column "production_status" text check ("production_status" in ('PENDING', 'IN_PRODUCTION', 'PRODUCED', 'DISCONTINUED')) null;`,
    );

    this.addSql(`alter table "warehouses" add column "parent_id" uuid null;`);
    this.addSql(
      `alter table "warehouses" add constraint "warehouses_parent_id_foreign" foreign key ("parent_id") references "warehouses" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "warehouses" add constraint "warehouses_type_check" check("type" in ('MAIN', 'BRANCH', 'SHOWROOM', 'TRANSIT', 'RETURN', 'PRODUCTION', 'CONSIGNMENT'));`,
    );
    this.addSql(
      `create index "warehouses_parent_id_index" on "warehouses" ("parent_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "product_collections_products" drop constraint "product_collections_products_product_collection_id_foreign";`,
    );

    this.addSql(
      `alter table "sample_loan_history" drop constraint "sample_loan_history_sample_id_foreign";`,
    );

    this.addSql(
      `alter table "inventory_count_lines" drop constraint "inventory_count_lines_count_id_foreign";`,
    );

    this.addSql(`drop table if exists "product_collections" cascade;`);

    this.addSql(`drop table if exists "product_collections_products" cascade;`);

    this.addSql(`drop table if exists "physical_samples" cascade;`);

    this.addSql(`drop table if exists "sample_loan_history" cascade;`);

    this.addSql(`drop table if exists "inventory_counts" cascade;`);

    this.addSql(`drop table if exists "inventory_count_lines" cascade;`);

    this.addSql(
      `alter table "warehouses" drop constraint if exists "warehouses_type_check";`,
    );

    this.addSql(
      `alter table "warehouses" drop constraint "warehouses_parent_id_foreign";`,
    );

    this.addSql(
      `alter table "partners" drop column "customer_subtype", drop column "supplier_subtype";`,
    );

    this.addSql(
      `alter table "product_variants" drop column "production_status";`,
    );

    this.addSql(`drop index "warehouses_parent_id_index";`);
    this.addSql(`alter table "warehouses" drop column "parent_id";`);

    this.addSql(
      `alter table "warehouses" add constraint "warehouses_type_check" check("type" in ('MAIN', 'TRANSIT', 'RETURN', 'PRODUCTION', 'CONSIGNMENT'));`,
    );
  }
}
