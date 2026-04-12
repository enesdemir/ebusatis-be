import { Migration } from '@mikro-orm/migrations';

export class Migration20260411135221 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "tax_reports" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "period" varchar(255) not null, "type" text check ("type" in ('KDV', 'STOPAJ', 'GUMRUK')) not null, "status" text check ("status" in ('DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED')) not null default 'DRAFT', "total_tax_base" numeric(12,2) not null default 0, "total_tax" numeric(12,2) not null default 0, "deductible_tax" numeric(12,2) not null default 0, "payable_tax" numeric(12,2) not null default 0, "lines" jsonb null, "note" varchar(255) null, constraint "tax_reports_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "tax_reports_tenant_id_index" on "tax_reports" ("tenant_id");`,
    );

    this.addSql(
      `create table "sales_channels" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "type" text check ("type" in ('MARKETPLACE', 'B2B_PORTAL', 'WEBSHOP', 'POS')) not null default 'MARKETPLACE', "platform" varchar(255) null, "api_url" varchar(255) null, "credentials" jsonb null, "sync_settings" jsonb null, "is_active" boolean not null default true, "last_sync_at" timestamptz null, "note" varchar(255) null, constraint "sales_channels_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "sales_channels_tenant_id_index" on "sales_channels" ("tenant_id");`,
    );

    this.addSql(
      `create table "exchange_gain_losses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "from_currency" varchar(255) not null, "to_currency" varchar(255) not null, "transaction_date" date not null, "settlement_date" date null, "original_rate" numeric(12,6) not null, "settlement_rate" numeric(12,6) null, "amount" numeric(12,2) not null, "gain_loss" numeric(12,2) not null default 0, "reference_type" varchar(255) null, "reference_id" varchar(255) null, "note" varchar(255) null, constraint "exchange_gain_losses_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "exchange_gain_losses_tenant_id_index" on "exchange_gain_losses" ("tenant_id");`,
    );

    this.addSql(
      `create table "channel_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "channel_id" uuid not null, "external_order_id" varchar(255) not null, "external_status" varchar(255) null, "order_data" jsonb null, "linked_sales_order_id" varchar(255) null, "sync_status" varchar(255) null, "synced_at" timestamptz null, "note" varchar(255) null, constraint "channel_orders_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "channel_orders_tenant_id_index" on "channel_orders" ("tenant_id");`,
    );

    this.addSql(
      `create table "stock_valuations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "period_date" date not null, "product_id" uuid null, "method" text check ("method" in ('FIFO', 'LIFO', 'AVERAGE')) not null default 'FIFO', "total_quantity" numeric(12,2) not null default 0, "total_cost" numeric(12,2) not null default 0, "unit_cost" numeric(12,2) not null default 0, "currency" varchar(255) null, "layers" jsonb null, "note" varchar(255) null, constraint "stock_valuations_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "stock_valuations_tenant_id_index" on "stock_valuations" ("tenant_id");`,
    );

    this.addSql(
      `create table "channel_product_mappings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "channel_id" uuid not null, "variant_id" uuid not null, "external_id" varchar(255) null, "external_sku" varchar(255) null, "channel_price" numeric(10,2) null, "synced_quantity" int null, "sync_status" text check ("sync_status" in ('PENDING', 'SYNCED', 'ERROR', 'NOT_LISTED')) not null default 'PENDING', "last_sync_at" timestamptz null, "sync_error" varchar(255) null, constraint "channel_product_mappings_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "channel_product_mappings_tenant_id_index" on "channel_product_mappings" ("tenant_id");`,
    );

    this.addSql(
      `create table "shipment_plans" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "plan_number" varchar(255) not null, "status" text check ("status" in ('DRAFT', 'CONFIRMED', 'IN_TRANSIT', 'AT_CUSTOMS', 'DELIVERED', 'CANCELLED')) not null default 'DRAFT', "origin" varchar(255) null, "destination" varchar(255) null, "incoterm" varchar(255) null, "container_no" varchar(255) null, "container_type" varchar(255) null, "seal_no" varchar(255) null, "vessel" varchar(255) null, "voyage_no" varchar(255) null, "estimated_departure" date null, "estimated_arrival" date null, "actual_departure" timestamptz null, "actual_arrival" timestamptz null, "freight_cost" numeric(10,2) not null default 0, "freight_currency" varchar(255) null, "carrier" varchar(255) null, "tracking_url" varchar(255) null, "note" varchar(255) null, "created_by_id" uuid not null, "linked_order_ids" jsonb null, constraint "shipment_plans_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "shipment_plans_tenant_id_index" on "shipment_plans" ("tenant_id");`,
    );

    this.addSql(
      `create table "freight_quotes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_plan_id" uuid null, "carrier" varchar(255) not null, "route" varchar(255) null, "price" numeric(10,2) not null, "currency" varchar(255) null, "transit_days" int null, "valid_until" date null, "is_selected" boolean not null default false, "note" varchar(255) null, constraint "freight_quotes_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "freight_quotes_tenant_id_index" on "freight_quotes" ("tenant_id");`,
    );

    this.addSql(
      `create table "customs_declarations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "declaration_number" varchar(255) not null, "shipment_plan_id" uuid null, "status" text check ("status" in ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')) not null default 'DRAFT', "declaration_type" varchar(255) null, "customs_duty" numeric(10,2) not null default 0, "customs_vat" numeric(10,2) not null default 0, "total_cost" numeric(10,2) not null default 0, "currency" varchar(255) null, "submitted_at" date null, "approved_at" date null, "note" varchar(255) null, "documents" jsonb null, constraint "customs_declarations_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "customs_declarations_tenant_id_index" on "customs_declarations" ("tenant_id");`,
    );

    this.addSql(
      `create table "container_events" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_plan_id" uuid not null, "event_type" varchar(255) not null, "location" varchar(255) null, "event_date" timestamptz not null, "note" varchar(255) null, constraint "container_events_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "container_events_tenant_id_index" on "container_events" ("tenant_id");`,
    );

    this.addSql(
      `create table "rfqs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "rfq_number" varchar(255) not null, "title" varchar(255) not null, "description" varchar(255) null, "status" text check ("status" in ('DRAFT', 'SENT', 'RECEIVED', 'EVALUATED', 'CLOSED', 'CANCELLED')) not null default 'DRAFT', "deadline" date null, "note" varchar(255) null, "supplier_ids" jsonb null, "items" jsonb null, "created_by_id" uuid not null, constraint "rfqs_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "rfqs_tenant_id_index" on "rfqs" ("tenant_id");`);

    this.addSql(
      `create table "rfq_responses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "rfq_id" uuid not null, "supplier_id" varchar(255) not null, "supplier_name" varchar(255) null, "total_price" numeric(10,2) not null default 0, "currency" varchar(255) null, "lead_time_days" int null, "valid_until" date null, "line_items" jsonb null, "note" varchar(255) null, "is_selected" boolean not null default false, "received_at" timestamptz null, constraint "rfq_responses_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "rfq_responses_tenant_id_index" on "rfq_responses" ("tenant_id");`,
    );

    this.addSql(
      `create table "notifications" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "recipient_id" uuid not null, "type" text check ("type" in ('ORDER', 'INVENTORY', 'FINANCE', 'PRODUCTION', 'LOGISTICS', 'SYSTEM')) not null, "severity" text check ("severity" in ('INFO', 'WARNING', 'CRITICAL')) not null default 'INFO', "title" varchar(255) not null, "message" text not null, "icon" varchar(50) null, "action_url" varchar(255) null, "reference_type" varchar(50) null, "reference_id" varchar(255) null, "is_read" boolean not null default false, "read_at" timestamptz null, constraint "notifications_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "idx_notification_tenant_date" on "notifications" ("tenant_id", "created_at");`,
    );
    this.addSql(
      `create index "idx_notification_recipient_read" on "notifications" ("recipient_id", "is_read");`,
    );

    this.addSql(
      `alter table "tax_reports" add constraint "tax_reports_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "sales_channels" add constraint "sales_channels_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "exchange_gain_losses" add constraint "exchange_gain_losses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "channel_orders" add constraint "channel_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "channel_orders" add constraint "channel_orders_channel_id_foreign" foreign key ("channel_id") references "sales_channels" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "stock_valuations" add constraint "stock_valuations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "stock_valuations" add constraint "stock_valuations_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "channel_product_mappings" add constraint "channel_product_mappings_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "channel_product_mappings" add constraint "channel_product_mappings_channel_id_foreign" foreign key ("channel_id") references "sales_channels" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "channel_product_mappings" add constraint "channel_product_mappings_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "shipment_plans" add constraint "shipment_plans_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "shipment_plans" add constraint "shipment_plans_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "freight_quotes" add constraint "freight_quotes_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "freight_quotes" add constraint "freight_quotes_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "customs_declarations" add constraint "customs_declarations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "customs_declarations" add constraint "customs_declarations_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "container_events" add constraint "container_events_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "container_events" add constraint "container_events_shipment_plan_id_foreign" foreign key ("shipment_plan_id") references "shipment_plans" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "rfqs" add constraint "rfqs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "rfqs" add constraint "rfqs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "rfq_responses" add constraint "rfq_responses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "rfq_responses" add constraint "rfq_responses_rfq_id_foreign" foreign key ("rfq_id") references "rfqs" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "notifications" add constraint "notifications_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "notifications" add constraint "notifications_recipient_id_foreign" foreign key ("recipient_id") references "users" ("id") on update cascade;`,
    );

    // NOT: partner_addresses kolon/FK degisiklikleri Migration20260409120000
    // tarafindan zaten yapildi. mikro-orm bunlari tekrar onerdi cunku snapshot
    // dosyasi M3 oncesi state'i tutuyordu. Buradan cikartildi.
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "channel_orders" drop constraint "channel_orders_channel_id_foreign";`,
    );

    this.addSql(
      `alter table "channel_product_mappings" drop constraint "channel_product_mappings_channel_id_foreign";`,
    );

    this.addSql(
      `alter table "freight_quotes" drop constraint "freight_quotes_shipment_plan_id_foreign";`,
    );

    this.addSql(
      `alter table "customs_declarations" drop constraint "customs_declarations_shipment_plan_id_foreign";`,
    );

    this.addSql(
      `alter table "container_events" drop constraint "container_events_shipment_plan_id_foreign";`,
    );

    this.addSql(
      `alter table "rfq_responses" drop constraint "rfq_responses_rfq_id_foreign";`,
    );

    this.addSql(`drop table if exists "tax_reports" cascade;`);

    this.addSql(`drop table if exists "sales_channels" cascade;`);

    this.addSql(`drop table if exists "exchange_gain_losses" cascade;`);

    this.addSql(`drop table if exists "channel_orders" cascade;`);

    this.addSql(`drop table if exists "stock_valuations" cascade;`);

    this.addSql(`drop table if exists "channel_product_mappings" cascade;`);

    this.addSql(`drop table if exists "shipment_plans" cascade;`);

    this.addSql(`drop table if exists "freight_quotes" cascade;`);

    this.addSql(`drop table if exists "customs_declarations" cascade;`);

    this.addSql(`drop table if exists "container_events" cascade;`);

    this.addSql(`drop table if exists "rfqs" cascade;`);

    this.addSql(`drop table if exists "rfq_responses" cascade;`);

    this.addSql(`drop table if exists "notifications" cascade;`);
  }
}
