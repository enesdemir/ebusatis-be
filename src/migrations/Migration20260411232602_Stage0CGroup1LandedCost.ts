import { Migration } from '@mikro-orm/migrations';

export class Migration20260411232602_Stage0CGroup1LandedCost extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "shipment_legs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_id" uuid not null, "leg_number" int not null, "leg_type" text check ("leg_type" in ('FACTORY_TO_PORT', 'SEA', 'AIR', 'RAIL', 'PORT_TO_WAREHOUSE', 'WAREHOUSE_TO_WAREHOUSE', 'TRANSIT_STORAGE', 'LAST_MILE')) not null, "origin_location" varchar(255) null, "destination_location" varchar(255) null, "intermediate_warehouse_id" uuid null, "estimated_departure" timestamptz null, "estimated_arrival" timestamptz null, "actual_departure" timestamptz null, "actual_arrival" timestamptz null, "carrier_id" uuid null, "freight_cost" numeric(14,2) not null default 0, "storage_cost" numeric(14,2) not null default 0, "other_costs" numeric(14,2) not null default 0, "currency_id" uuid null, "notes" text null, constraint "shipment_legs_pkey" primary key ("id"));`);
    this.addSql(`create index "shipment_legs_tenant_id_index" on "shipment_legs" ("tenant_id");`);
    this.addSql(`create index "shipment_legs_shipment_id_index" on "shipment_legs" ("shipment_id");`);

    this.addSql(`create table "carrier_payment_schedules" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "leg_id" uuid not null, "installment_number" int not null, "trigger" text check ("trigger" in ('ON_BOOKING', 'ON_LOADING', 'ON_DEPARTURE', 'ON_ARRIVAL', 'ON_DELIVERY', 'FIXED_DATE')) not null, "amount" numeric(14,2) not null, "percentage" numeric(5,2) null, "due_date" date null, "status" text check ("status" in ('PENDING', 'SCHEDULED', 'PAID', 'CANCELLED')) not null default 'PENDING', "paid_at" timestamptz null, "payment_id" uuid null, "notes" text null, constraint "carrier_payment_schedules_pkey" primary key ("id"));`);
    this.addSql(`create index "carrier_payment_schedules_tenant_id_index" on "carrier_payment_schedules" ("tenant_id");`);
    this.addSql(`create index "carrier_payment_schedules_leg_id_index" on "carrier_payment_schedules" ("leg_id");`);

    this.addSql(`create table "landed_cost_calculations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "purchase_order_id" uuid not null, "shipment_id" uuid null, "product_cost" numeric(14,2) not null, "freight_cost" numeric(14,2) not null default 0, "customs_duty" numeric(14,2) not null default 0, "customs_vat" numeric(14,2) not null default 0, "broker_fee" numeric(14,2) not null default 0, "insurance_cost" numeric(14,2) not null default 0, "storage_cost" numeric(14,2) not null default 0, "inland_transport_cost" numeric(14,2) not null default 0, "other_costs" numeric(14,2) not null default 0, "total_landed_cost" numeric(14,2) not null, "currency_id" uuid not null, "calculated_at" timestamptz not null, "calculated_by_id" uuid null, "notes" text null, "line_allocations" jsonb null, constraint "landed_cost_calculations_pkey" primary key ("id"));`);
    this.addSql(`create index "landed_cost_calculations_tenant_id_index" on "landed_cost_calculations" ("tenant_id");`);
    this.addSql(`create index "landed_cost_calculations_purchase_order_id_index" on "landed_cost_calculations" ("purchase_order_id");`);
    this.addSql(`create index "landed_cost_calculations_shipment_id_index" on "landed_cost_calculations" ("shipment_id");`);

    this.addSql(`alter table "shipment_legs" add constraint "shipment_legs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "shipment_legs" add constraint "shipment_legs_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade;`);
    this.addSql(`alter table "shipment_legs" add constraint "shipment_legs_intermediate_warehouse_id_foreign" foreign key ("intermediate_warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipment_legs" add constraint "shipment_legs_carrier_id_foreign" foreign key ("carrier_id") references "partners" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipment_legs" add constraint "shipment_legs_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "carrier_payment_schedules" add constraint "carrier_payment_schedules_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "carrier_payment_schedules" add constraint "carrier_payment_schedules_leg_id_foreign" foreign key ("leg_id") references "shipment_legs" ("id") on update cascade;`);
    this.addSql(`alter table "carrier_payment_schedules" add constraint "carrier_payment_schedules_payment_id_foreign" foreign key ("payment_id") references "payments" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "landed_cost_calculations" add constraint "landed_cost_calculations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "landed_cost_calculations" add constraint "landed_cost_calculations_purchase_order_id_foreign" foreign key ("purchase_order_id") references "purchase_orders" ("id") on update cascade;`);
    this.addSql(`alter table "landed_cost_calculations" add constraint "landed_cost_calculations_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "landed_cost_calculations" add constraint "landed_cost_calculations_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade;`);
    this.addSql(`alter table "landed_cost_calculations" add constraint "landed_cost_calculations_calculated_by_id_foreign" foreign key ("calculated_by_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "purchase_orders" add column "down_payment_amount" numeric(14,2) not null default 0, add column "payment_terms" text null, add column "delivery_warning_config" jsonb null, add column "qr_code" text null, add column "digital_signature_url" varchar(255) null;`);

    this.addSql(`alter table "purchase_order_lines" add column "landed_unit_cost" numeric(14,4) null;`);
    this.addSql(`alter table "purchase_order_lines" alter column "quantity" type numeric(12,2) using ("quantity"::numeric(12,2));`);
    this.addSql(`alter table "purchase_order_lines" alter column "unit_price" type numeric(14,4) using ("unit_price"::numeric(14,4));`);
    this.addSql(`alter table "purchase_order_lines" alter column "received_quantity" type numeric(12,2) using ("received_quantity"::numeric(12,2));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "carrier_payment_schedules" drop constraint "carrier_payment_schedules_leg_id_foreign";`);

    this.addSql(`drop table if exists "shipment_legs" cascade;`);

    this.addSql(`drop table if exists "carrier_payment_schedules" cascade;`);

    this.addSql(`drop table if exists "landed_cost_calculations" cascade;`);

    this.addSql(`alter table "purchase_orders" drop column "down_payment_amount", drop column "payment_terms", drop column "delivery_warning_config", drop column "qr_code", drop column "digital_signature_url";`);

    this.addSql(`alter table "purchase_order_lines" drop column "landed_unit_cost";`);

    this.addSql(`alter table "purchase_order_lines" alter column "quantity" type numeric(10,2) using ("quantity"::numeric(10,2));`);
    this.addSql(`alter table "purchase_order_lines" alter column "unit_price" type numeric(10,2) using ("unit_price"::numeric(10,2));`);
    this.addSql(`alter table "purchase_order_lines" alter column "received_quantity" type numeric(10,2) using ("received_quantity"::numeric(10,2));`);
  }

}
