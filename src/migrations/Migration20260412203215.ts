import { Migration } from '@mikro-orm/migrations';

export class Migration20260412203215 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "bills_of_materials" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "variant_id" uuid not null, "name" varchar(255) not null, "yield" numeric(10,2) not null default 1, "is_active" boolean not null default true, "notes" text null, constraint "bills_of_materials_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bills_of_materials_tenant_id_index" on "bills_of_materials" ("tenant_id");`,
    );
    this.addSql(
      `alter table "bills_of_materials" add constraint "bills_of_materials_tenant_id_variant_id_unique" unique ("tenant_id", "variant_id");`,
    );

    this.addSql(
      `create table "bom_components" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "bom_id" uuid not null, "component_variant_id" uuid not null, "quantity" numeric(10,3) not null, "unit_id" uuid null, "is_required" boolean not null default true, "notes" text null, constraint "bom_components_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bom_components_tenant_id_index" on "bom_components" ("tenant_id");`,
    );

    this.addSql(
      `alter table "bills_of_materials" add constraint "bills_of_materials_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bills_of_materials" add constraint "bills_of_materials_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "bom_components" add constraint "bom_components_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bom_components" add constraint "bom_components_bom_id_foreign" foreign key ("bom_id") references "bills_of_materials" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bom_components" add constraint "bom_components_component_variant_id_foreign" foreign key ("component_variant_id") references "product_variants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bom_components" add constraint "bom_components_unit_id_foreign" foreign key ("unit_id") references "units_of_measure" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "bom_components" drop constraint "bom_components_bom_id_foreign";`,
    );

    this.addSql(`drop table if exists "bills_of_materials" cascade;`);

    this.addSql(`drop table if exists "bom_components" cascade;`);
  }
}
