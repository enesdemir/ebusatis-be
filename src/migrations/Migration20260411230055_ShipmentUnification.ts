import { Migration } from '@mikro-orm/migrations';

export class Migration20260411230055_ShipmentUnification extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "freight_quotes" drop constraint "freight_quotes_shipment_plan_id_foreign";`);

    this.addSql(`alter table "customs_declarations" drop constraint "customs_declarations_shipment_plan_id_foreign";`);

    this.addSql(`alter table "container_events" drop constraint "container_events_shipment_plan_id_foreign";`);

    this.addSql(`drop table if exists "shipment_plans" cascade;`);

    this.addSql(`alter table "shipments" drop constraint if exists "shipments_status_check";`);

    this.addSql(`alter table "shipments" drop constraint "shipments_warehouse_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_sales_order_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_created_by_id_foreign";`);

    this.addSql(`alter table "shipment_lines" drop constraint "shipment_lines_order_line_id_foreign";`);

    // Drop legacy columns from the old finance/shipments table — they
    // are being replaced by a richer set rather than renamed, so the
    // semantics stay clear in future migrations.
    this.addSql(`alter table "shipments" drop column "shipped_at", drop column "delivered_at", drop column "warehouse_id", drop column "tracking_number", drop column "note";`);

    // Add the new unified columns.
    this.addSql(`alter table "shipments" add column "direction" text check ("direction" in ('INBOUND', 'OUTBOUND')) not null, add column "purchase_order_id" uuid null, add column "origin_warehouse_id" uuid null, add column "destination_warehouse_id" uuid null, add column "origin_address" varchar(255) null, add column "destination_address" varchar(255) null, add column "carrier_id" uuid null, add column "carrier_tracking_number" varchar(255) null, add column "carrier_tracking_url" varchar(255) null, add column "container_number" varchar(255) null, add column "container_type" varchar(255) null, add column "seal_number" varchar(255) null, add column "vessel" varchar(255) null, add column "voyage_number" varchar(255) null, add column "incoterm" text check ("incoterm" in ('EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF')) null, add column "vehicle_plate" varchar(255) null, add column "vehicle_type" varchar(255) null, add column "driver_name" varchar(255) null, add column "driver_phone" varchar(255) null, add column "driver_id_number" varchar(255) null, add column "estimated_departure" date null, add column "estimated_arrival" date null, add column "actual_departure" timestamptz null, add column "actual_arrival" timestamptz null, add column "total_freight_cost" numeric(14,2) not null default 0, add column "total_customs_cost" numeric(14,2) not null default 0, add column "total_storage_cost" numeric(14,2) not null default 0, add column "cost_currency_id" uuid null, add column "notes" text null;`);

    // Loosen previously NOT NULL legacy columns.
    this.addSql(`alter table "shipments" alter column "sales_order_id" drop default;`);
    this.addSql(`alter table "shipments" alter column "sales_order_id" type uuid using ("sales_order_id"::text::uuid);`);
    this.addSql(`alter table "shipments" alter column "sales_order_id" drop not null;`);
    this.addSql(`alter table "shipments" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "shipments" alter column "status" set default 'DRAFT';`);
    this.addSql(`alter table "shipments" alter column "created_by_id" drop default;`);
    this.addSql(`alter table "shipments" alter column "created_by_id" type uuid using ("created_by_id"::text::uuid);`);
    this.addSql(`alter table "shipments" alter column "created_by_id" drop not null;`);

    // Foreign keys for the new columns.
    this.addSql(`alter table "shipments" add constraint "shipments_purchase_order_id_foreign" foreign key ("purchase_order_id") references "purchase_orders" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_origin_warehouse_id_foreign" foreign key ("origin_warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_destination_warehouse_id_foreign" foreign key ("destination_warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_carrier_id_foreign" foreign key ("carrier_id") references "partners" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_cost_currency_id_foreign" foreign key ("cost_currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_status_check" check("status" in ('DRAFT', 'CONFIRMED', 'PREPARING', 'IN_TRANSIT', 'AT_CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'CANCELLED'));`);
    this.addSql(`create index "shipments_direction_index" on "shipments" ("direction");`);

    this.addSql(`alter table "freight_quotes" drop column "carrier", drop column "currency";`);

    this.addSql(`alter table "freight_quotes" add column "carrier_id" uuid null, add column "currency_id" uuid null;`);
    this.addSql(`alter table "freight_quotes" alter column "price" type numeric(14,2) using ("price"::numeric(14,2));`);
    this.addSql(`alter table "freight_quotes" alter column "note" type text using ("note"::text);`);
    this.addSql(`alter table "freight_quotes" add constraint "freight_quotes_carrier_id_foreign" foreign key ("carrier_id") references "partners" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "freight_quotes" add constraint "freight_quotes_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "freight_quotes" rename column "shipment_plan_id" to "shipment_id";`);
    this.addSql(`alter table "freight_quotes" add constraint "freight_quotes_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "freight_quotes_shipment_id_index" on "freight_quotes" ("shipment_id");`);

    this.addSql(`alter table "customs_declarations" drop column "currency";`);

    this.addSql(`alter table "customs_declarations" add column "broker_fee" numeric(14,2) not null default 0, add column "insurance_cost" numeric(14,2) not null default 0, add column "currency_id" uuid null;`);
    this.addSql(`alter table "customs_declarations" alter column "customs_duty" type numeric(14,2) using ("customs_duty"::numeric(14,2));`);
    this.addSql(`alter table "customs_declarations" alter column "customs_vat" type numeric(14,2) using ("customs_vat"::numeric(14,2));`);
    this.addSql(`alter table "customs_declarations" alter column "total_cost" type numeric(14,2) using ("total_cost"::numeric(14,2));`);
    this.addSql(`alter table "customs_declarations" alter column "note" type text using ("note"::text);`);
    this.addSql(`alter table "customs_declarations" add constraint "customs_declarations_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "customs_declarations" rename column "shipment_plan_id" to "shipment_id";`);
    this.addSql(`alter table "customs_declarations" add constraint "customs_declarations_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "customs_declarations_shipment_id_index" on "customs_declarations" ("shipment_id");`);

    this.addSql(`alter table "container_events" alter column "event_type" type text using ("event_type"::text);`);
    this.addSql(`alter table "container_events" alter column "note" type text using ("note"::text);`);
    this.addSql(`alter table "container_events" add constraint "container_events_event_type_check" check("event_type" in ('LOADED_AT_FACTORY', 'IN_TRANSIT_TO_PORT', 'AT_ORIGIN_PORT', 'LOADED_ON_VESSEL', 'IN_TRANSIT_AT_SEA', 'AT_DESTINATION_PORT', 'CUSTOMS_HOLD', 'CUSTOMS_CLEARED', 'IN_TRANSIT_TO_WAREHOUSE', 'ARRIVED_AT_WAREHOUSE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'));`);
    this.addSql(`alter table "container_events" rename column "shipment_plan_id" to "shipment_id";`);
    this.addSql(`alter table "container_events" add constraint "container_events_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade;`);
    this.addSql(`create index "container_events_shipment_id_index" on "container_events" ("shipment_id");`);

    this.addSql(`alter table "shipment_lines" add column "sales_order_line_id" uuid null;`);
    this.addSql(`alter table "shipment_lines" alter column "quantity" type numeric(12,2) using ("quantity"::numeric(12,2));`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_sales_order_line_id_foreign" foreign key ("sales_order_line_id") references "sales_order_lines" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipment_lines" rename column "order_line_id" to "purchase_order_line_id";`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_purchase_order_line_id_foreign" foreign key ("purchase_order_line_id") references "purchase_order_lines" ("id") on update cascade on delete set null;`);
    this.addSql(`create index "shipment_lines_shipment_id_index" on "shipment_lines" ("shipment_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "shipment_plans" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "plan_number" varchar(255) not null, "status" text check ("status" in ('DRAFT', 'CONFIRMED', 'IN_TRANSIT', 'AT_CUSTOMS', 'DELIVERED', 'CANCELLED')) not null default 'DRAFT', "origin" varchar(255) null, "destination" varchar(255) null, "incoterm" varchar(255) null, "container_no" varchar(255) null, "container_type" varchar(255) null, "seal_no" varchar(255) null, "vessel" varchar(255) null, "voyage_no" varchar(255) null, "estimated_departure" date null, "estimated_arrival" date null, "actual_departure" timestamptz null, "actual_arrival" timestamptz null, "freight_cost" numeric(10,2) not null default 0, "freight_currency" varchar(255) null, "carrier" varchar(255) null, "tracking_url" varchar(255) null, "note" varchar(255) null, "created_by_id" uuid not null, "linked_order_ids" jsonb null, constraint "shipment_plans_pkey" primary key ("id"));`);
    this.addSql(`create index "shipment_plans_tenant_id_index" on "shipment_plans" ("tenant_id");`);

    this.addSql(`alter table "shipment_plans" add constraint "shipment_plans_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "shipment_plans" add constraint "shipment_plans_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "freight_quotes" drop constraint "freight_quotes_shipment_id_foreign";`);
    this.addSql(`alter table "freight_quotes" drop constraint "freight_quotes_carrier_id_foreign";`);
    this.addSql(`alter table "freight_quotes" drop constraint "freight_quotes_currency_id_foreign";`);

    this.addSql(`alter table "customs_declarations" drop constraint "customs_declarations_shipment_id_foreign";`);
    this.addSql(`alter table "customs_declarations" drop constraint "customs_declarations_currency_id_foreign";`);

    this.addSql(`alter table "container_events" drop constraint if exists "container_events_event_type_check";`);

    this.addSql(`alter table "container_events" drop constraint "container_events_shipment_id_foreign";`);

    this.addSql(`alter table "shipments" drop constraint if exists "shipments_status_check";`);

    this.addSql(`alter table "shipments" drop constraint "shipments_purchase_order_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_origin_warehouse_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_destination_warehouse_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_carrier_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_cost_currency_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_sales_order_id_foreign";`);
    this.addSql(`alter table "shipments" drop constraint "shipments_created_by_id_foreign";`);

    this.addSql(`alter table "shipment_lines" drop constraint "shipment_lines_purchase_order_line_id_foreign";`);
    this.addSql(`alter table "shipment_lines" drop constraint "shipment_lines_sales_order_line_id_foreign";`);

    this.addSql(`drop index "freight_quotes_shipment_id_index";`);
    this.addSql(`alter table "freight_quotes" drop column "carrier_id", drop column "currency_id";`);

    this.addSql(`alter table "freight_quotes" add column "carrier" varchar(255) not null, add column "currency" varchar(255) null;`);
    this.addSql(`alter table "freight_quotes" alter column "price" type numeric(10,2) using ("price"::numeric(10,2));`);
    this.addSql(`alter table "freight_quotes" alter column "note" type varchar(255) using ("note"::varchar(255));`);
    this.addSql(`alter table "freight_quotes" rename column "shipment_id" to "shipment_plan_id";`);
    this.addSql(`alter table "freight_quotes" add constraint "freight_quotes_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade on delete set null;`);

    this.addSql(`drop index "customs_declarations_shipment_id_index";`);
    this.addSql(`alter table "customs_declarations" drop column "broker_fee", drop column "insurance_cost", drop column "currency_id";`);

    this.addSql(`alter table "customs_declarations" add column "currency" varchar(255) null;`);
    this.addSql(`alter table "customs_declarations" alter column "customs_duty" type numeric(10,2) using ("customs_duty"::numeric(10,2));`);
    this.addSql(`alter table "customs_declarations" alter column "customs_vat" type numeric(10,2) using ("customs_vat"::numeric(10,2));`);
    this.addSql(`alter table "customs_declarations" alter column "total_cost" type numeric(10,2) using ("total_cost"::numeric(10,2));`);
    this.addSql(`alter table "customs_declarations" alter column "note" type varchar(255) using ("note"::varchar(255));`);
    this.addSql(`alter table "customs_declarations" rename column "shipment_id" to "shipment_plan_id";`);
    this.addSql(`alter table "customs_declarations" add constraint "customs_declarations_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade on delete set null;`);

    this.addSql(`drop index "container_events_shipment_id_index";`);

    this.addSql(`alter table "container_events" alter column "event_type" type varchar(255) using ("event_type"::varchar(255));`);
    this.addSql(`alter table "container_events" alter column "note" type varchar(255) using ("note"::varchar(255));`);
    this.addSql(`alter table "container_events" rename column "shipment_id" to "shipment_plan_id";`);
    this.addSql(`alter table "container_events" add constraint "container_events_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade;`);

    this.addSql(`drop index "shipments_direction_index";`);
    this.addSql(`alter table "shipments" drop column "direction", drop column "origin_warehouse_id", drop column "destination_warehouse_id", drop column "destination_address", drop column "carrier_id", drop column "carrier_tracking_number", drop column "carrier_tracking_url", drop column "container_number", drop column "container_type", drop column "seal_number", drop column "vessel", drop column "voyage_number", drop column "incoterm", drop column "vehicle_plate", drop column "vehicle_type", drop column "driver_name", drop column "driver_phone", drop column "driver_id_number", drop column "estimated_departure", drop column "estimated_arrival", drop column "actual_departure", drop column "actual_arrival", drop column "total_freight_cost", drop column "total_customs_cost", drop column "total_storage_cost", drop column "cost_currency_id";`);

    this.addSql(`alter table "shipments" add column "shipped_at" timestamptz null, add column "delivered_at" timestamptz null;`);
    this.addSql(`alter table "shipments" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "shipments" alter column "status" set default 'PREPARING';`);
    this.addSql(`alter table "shipments" alter column "sales_order_id" drop default;`);
    this.addSql(`alter table "shipments" alter column "sales_order_id" type uuid using ("sales_order_id"::text::uuid);`);
    this.addSql(`alter table "shipments" alter column "sales_order_id" set not null;`);
    this.addSql(`alter table "shipments" alter column "created_by_id" drop default;`);
    this.addSql(`alter table "shipments" alter column "created_by_id" type uuid using ("created_by_id"::text::uuid);`);
    this.addSql(`alter table "shipments" alter column "created_by_id" set not null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_status_check" check("status" in ('PREPARING', 'SHIPPED', 'DELIVERED', 'RETURNED'));`);
    this.addSql(`alter table "shipments" rename column "purchase_order_id" to "warehouse_id";`);
    this.addSql(`alter table "shipments" rename column "origin_address" to "tracking_number";`);
    this.addSql(`alter table "shipments" rename column "notes" to "note";`);
    this.addSql(`alter table "shipments" add constraint "shipments_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade;`);
    this.addSql(`alter table "shipments" add constraint "shipments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`drop index "shipment_lines_shipment_id_index";`);
    this.addSql(`alter table "shipment_lines" drop column "sales_order_line_id";`);

    this.addSql(`alter table "shipment_lines" alter column "quantity" type numeric(10,2) using ("quantity"::numeric(10,2));`);
    this.addSql(`alter table "shipment_lines" rename column "purchase_order_line_id" to "order_line_id";`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade on delete set null;`);
  }

}
