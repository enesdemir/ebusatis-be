import { Migration } from '@mikro-orm/migrations';

export class Migration20260411235735_Stage0CGroup2DiscrepancyClaims extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "supplier_claims" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "claim_number" varchar(255) not null, "supplier_id" uuid not null, "goods_receive_id" uuid not null, "purchase_order_id" uuid not null, "claim_type" text check ("claim_type" in ('SHORT_DELIVERY', 'DAMAGED', 'WRONG_VARIANT', 'WRONG_BATCH', 'QUALITY_ISSUE', 'OTHER')) not null, "status" text check ("status" in ('OPEN', 'NEGOTIATING', 'RESOLVED_CREDIT', 'RESOLVED_REPLACEMENT', 'RESOLVED_REFUND', 'REJECTED', 'CLOSED')) not null default 'OPEN', "claimed_amount" numeric(14,2) not null, "settled_amount" numeric(14,2) null, "currency_id" uuid null, "description" text not null, "photo_urls" jsonb null, "opened_at" timestamptz not null, "resolved_at" timestamptz null, "opened_by_id" uuid null, constraint "supplier_claims_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "supplier_claims_tenant_id_index" on "supplier_claims" ("tenant_id");`,
    );
    this.addSql(
      `create index "supplier_claims_claim_number_index" on "supplier_claims" ("claim_number");`,
    );
    this.addSql(
      `create index "supplier_claims_goods_receive_id_index" on "supplier_claims" ("goods_receive_id");`,
    );
    this.addSql(
      `create index "supplier_claims_purchase_order_id_index" on "supplier_claims" ("purchase_order_id");`,
    );

    this.addSql(
      `create table "supplier_claim_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "claim_id" uuid not null, "goods_receive_line_id" uuid null, "variant_id" uuid not null, "affected_quantity" numeric(12,2) not null, "unit_price" numeric(14,4) not null, "line_total" numeric(14,2) not null, "note" text null, constraint "supplier_claim_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "supplier_claim_lines_tenant_id_index" on "supplier_claim_lines" ("tenant_id");`,
    );
    this.addSql(
      `create index "supplier_claim_lines_claim_id_index" on "supplier_claim_lines" ("claim_id");`,
    );
    this.addSql(
      `create index "supplier_claim_lines_goods_receive_line_id_index" on "supplier_claim_lines" ("goods_receive_line_id");`,
    );

    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_goods_receive_id_foreign" foreign key ("goods_receive_id") references "goods_receives" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_purchase_order_id_foreign" foreign key ("purchase_order_id") references "purchase_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "supplier_claims" add constraint "supplier_claims_opened_by_id_foreign" foreign key ("opened_by_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "supplier_claim_lines" add constraint "supplier_claim_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claim_lines" add constraint "supplier_claim_lines_claim_id_foreign" foreign key ("claim_id") references "supplier_claims" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_claim_lines" add constraint "supplier_claim_lines_goods_receive_line_id_foreign" foreign key ("goods_receive_line_id") references "goods_receive_lines" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "supplier_claim_lines" add constraint "supplier_claim_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "goods_receives" add column "shipment_id" uuid null, add column "vehicle_plate" varchar(255) null, add column "vehicle_type" varchar(255) null, add column "driver_name" varchar(255) null, add column "driver_phone" varchar(255) null, add column "driver_id_number" varchar(255) null, add column "eta" timestamptz null, add column "received_by_id" uuid null, add column "shipment_responsible_id" uuid null;`,
    );
    this.addSql(
      `alter table "goods_receives" alter column "purchase_order_id" drop default;`,
    );
    this.addSql(
      `alter table "goods_receives" alter column "purchase_order_id" type uuid using ("purchase_order_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_received_by_id_foreign" foreign key ("received_by_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_shipment_responsible_id_foreign" foreign key ("shipment_responsible_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_purchase_order_id_foreign" foreign key ("purchase_order_id") references "purchase_orders" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "goods_receives_receive_number_index" on "goods_receives" ("receive_number");`,
    );
    this.addSql(
      `create index "goods_receives_purchase_order_id_index" on "goods_receives" ("purchase_order_id");`,
    );
    this.addSql(
      `create index "goods_receives_shipment_id_index" on "goods_receives" ("shipment_id");`,
    );

    this.addSql(
      `alter table "goods_receive_lines" add column "discrepancy_type" text check ("discrepancy_type" in ('NONE', 'QUANTITY_SHORT', 'QUANTITY_OVER', 'DAMAGED', 'WRONG_VARIANT', 'WRONG_BATCH', 'QUALITY_ISSUE', 'OTHER')) not null default 'NONE', add column "discrepancy_quantity" numeric(12,2) null, add column "discrepancy_reason" text null, add column "condition_notes" text null, add column "photo_evidence_urls" jsonb null, add column "claim_id" uuid null;`,
    );
    this.addSql(
      `alter table "goods_receive_lines" alter column "expected_quantity" type numeric(12,2) using ("expected_quantity"::numeric(12,2));`,
    );
    this.addSql(
      `alter table "goods_receive_lines" alter column "total_received_quantity" type numeric(12,2) using ("total_received_quantity"::numeric(12,2));`,
    );
    this.addSql(
      `alter table "goods_receive_lines" add constraint "goods_receive_lines_claim_id_foreign" foreign key ("claim_id") references "supplier_claims" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "goods_receive_lines_goods_receive_id_index" on "goods_receive_lines" ("goods_receive_id");`,
    );
    this.addSql(
      `create index "goods_receive_lines_claim_id_index" on "goods_receive_lines" ("claim_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "goods_receive_lines" drop constraint "goods_receive_lines_claim_id_foreign";`,
    );

    this.addSql(
      `alter table "supplier_claim_lines" drop constraint "supplier_claim_lines_claim_id_foreign";`,
    );

    this.addSql(`drop table if exists "supplier_claims" cascade;`);

    this.addSql(`drop table if exists "supplier_claim_lines" cascade;`);

    this.addSql(
      `alter table "goods_receives" alter column "purchase_order_id" type text using ("purchase_order_id"::text);`,
    );

    this.addSql(
      `alter table "goods_receives" drop constraint "goods_receives_purchase_order_id_foreign";`,
    );
    this.addSql(
      `alter table "goods_receives" drop constraint "goods_receives_shipment_id_foreign";`,
    );
    this.addSql(
      `alter table "goods_receives" drop constraint "goods_receives_received_by_id_foreign";`,
    );
    this.addSql(
      `alter table "goods_receives" drop constraint "goods_receives_shipment_responsible_id_foreign";`,
    );

    this.addSql(`drop index "goods_receives_receive_number_index";`);
    this.addSql(`drop index "goods_receives_purchase_order_id_index";`);
    this.addSql(`drop index "goods_receives_shipment_id_index";`);
    this.addSql(
      `alter table "goods_receives" drop column "shipment_id", drop column "vehicle_plate", drop column "vehicle_type", drop column "driver_name", drop column "driver_phone", drop column "driver_id_number", drop column "eta", drop column "received_by_id", drop column "shipment_responsible_id";`,
    );

    this.addSql(
      `alter table "goods_receives" alter column "purchase_order_id" type varchar(255) using ("purchase_order_id"::varchar(255));`,
    );

    this.addSql(`drop index "goods_receive_lines_goods_receive_id_index";`);
    this.addSql(`drop index "goods_receive_lines_claim_id_index";`);
    this.addSql(
      `alter table "goods_receive_lines" drop column "discrepancy_type", drop column "discrepancy_quantity", drop column "discrepancy_reason", drop column "condition_notes", drop column "photo_evidence_urls", drop column "claim_id";`,
    );

    this.addSql(
      `alter table "goods_receive_lines" alter column "expected_quantity" type numeric(10,2) using ("expected_quantity"::numeric(10,2));`,
    );
    this.addSql(
      `alter table "goods_receive_lines" alter column "total_received_quantity" type numeric(10,2) using ("total_received_quantity"::numeric(10,2));`,
    );
  }
}
