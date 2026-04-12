import { Migration } from '@mikro-orm/migrations';

export class Migration20260412065219_Stage4MultiTenantEntities extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "product_variant_attribute_values" add column "tenant_id" uuid not null;`,
    );
    this.addSql(
      `alter table "product_variant_attribute_values" add constraint "product_variant_attribute_values_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `create index "product_variant_attribute_values_tenant_id_index" on "product_variant_attribute_values" ("tenant_id");`,
    );

    this.addSql(
      `alter table "product_attribute_values" add column "tenant_id" uuid not null;`,
    );
    this.addSql(
      `alter table "product_attribute_values" add constraint "product_attribute_values_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `create index "product_attribute_values_tenant_id_index" on "product_attribute_values" ("tenant_id");`,
    );

    this.addSql(
      `alter table "inventory_transactions" add column "tenant_id" uuid not null;`,
    );
    this.addSql(
      `alter table "inventory_transactions" alter column "note" type text using ("note"::text);`,
    );
    this.addSql(
      `alter table "inventory_transactions" add constraint "inventory_transactions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `create index "inventory_transactions_tenant_id_index" on "inventory_transactions" ("tenant_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "product_variant_attribute_values" drop constraint "product_variant_attribute_values_tenant_id_foreign";`,
    );

    this.addSql(
      `alter table "product_attribute_values" drop constraint "product_attribute_values_tenant_id_foreign";`,
    );

    this.addSql(
      `alter table "inventory_transactions" drop constraint "inventory_transactions_tenant_id_foreign";`,
    );

    this.addSql(
      `drop index "product_variant_attribute_values_tenant_id_index";`,
    );
    this.addSql(
      `alter table "product_variant_attribute_values" drop column "tenant_id";`,
    );

    this.addSql(`drop index "product_attribute_values_tenant_id_index";`);
    this.addSql(
      `alter table "product_attribute_values" drop column "tenant_id";`,
    );

    this.addSql(`drop index "inventory_transactions_tenant_id_index";`);
    this.addSql(
      `alter table "inventory_transactions" drop column "tenant_id";`,
    );

    this.addSql(
      `alter table "inventory_transactions" alter column "note" type varchar(255) using ("note"::varchar(255));`,
    );
  }
}
