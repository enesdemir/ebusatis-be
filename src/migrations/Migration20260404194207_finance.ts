import { Migration } from '@mikro-orm/migrations';

export class Migration20260404194207_finance extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "document_links" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "source_type" varchar(255) not null, "source_id" varchar(255) not null, "target_type" varchar(255) not null, "target_id" varchar(255) not null, "link_type" text check ("link_type" in ('CREATED_FROM', 'PARTIAL', 'RETURN', 'CORRECTION')) not null default 'CREATED_FROM', constraint "document_links_pkey" primary key ("id"));`);
    this.addSql(`create index "document_links_tenant_id_index" on "document_links" ("tenant_id");`);

    this.addSql(`create table "payments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "payment_number" varchar(255) not null, "direction" text check ("direction" in ('INCOMING', 'OUTGOING')) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "amount" numeric(14,2) not null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "payment_date" date not null, "method_id" uuid null, "reference" varchar(255) null, "bank_account" varchar(255) null, "status" text check ("status" in ('PENDING', 'COMPLETED', 'CANCELLED')) not null default 'COMPLETED', "note" text null, "created_by_id" uuid not null, constraint "payments_pkey" primary key ("id"));`);
    this.addSql(`create index "payments_tenant_id_index" on "payments" ("tenant_id");`);
    this.addSql(`create index "payments_payment_number_index" on "payments" ("payment_number");`);

    this.addSql(`create table "invoices" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "invoice_number" varchar(255) not null, "type" text check ("type" in ('SALES', 'PURCHASE', 'RETURN_SALES', 'RETURN_PURCHASE')) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "issue_date" date not null, "due_date" date null, "status" text check ("status" in ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE')) not null default 'DRAFT', "subtotal" numeric(14,2) not null default 0, "discount_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "paid_amount" numeric(14,2) not null default 0, "payment_method_id" uuid null, "note" text null, "source_order_id" varchar(255) null, "created_by_id" uuid not null, constraint "invoices_pkey" primary key ("id"));`);
    this.addSql(`create index "invoices_tenant_id_index" on "invoices" ("tenant_id");`);
    this.addSql(`create index "invoices_invoice_number_index" on "invoices" ("invoice_number");`);

    this.addSql(`create table "payment_invoice_matches" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "payment_id" uuid not null, "invoice_id" uuid not null, "matched_amount" numeric(14,2) not null, "matched_at" timestamptz not null, constraint "payment_invoice_matches_pkey" primary key ("id"));`);
    this.addSql(`create index "payment_invoice_matches_tenant_id_index" on "payment_invoice_matches" ("tenant_id");`);

    this.addSql(`create table "invoice_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "invoice_id" uuid not null, "description" varchar(255) not null, "variant_id" uuid null, "quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "discount" numeric(5,2) not null default 0, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "source_order_line_id" varchar(255) null, constraint "invoice_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "invoice_lines_tenant_id_index" on "invoice_lines" ("tenant_id");`);

    this.addSql(`create table "shipments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_number" varchar(255) not null, "sales_order_id" uuid not null, "warehouse_id" uuid null, "delivery_method_id" uuid null, "status" text check ("status" in ('PREPARING', 'SHIPPED', 'DELIVERED', 'RETURNED')) not null default 'PREPARING', "tracking_number" varchar(255) null, "shipped_at" timestamptz null, "delivered_at" timestamptz null, "note" text null, "created_by_id" uuid not null, constraint "shipments_pkey" primary key ("id"));`);
    this.addSql(`create index "shipments_tenant_id_index" on "shipments" ("tenant_id");`);
    this.addSql(`create index "shipments_shipment_number_index" on "shipments" ("shipment_number");`);

    this.addSql(`create table "shipment_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_id" uuid not null, "order_line_id" uuid null, "variant_id" uuid not null, "quantity" numeric(10,2) not null, "note" text null, "roll_ids" jsonb not null default '[]', constraint "shipment_lines_pkey" primary key ("id"));`);
    this.addSql(`create index "shipment_lines_tenant_id_index" on "shipment_lines" ("tenant_id");`);

    this.addSql(`alter table "document_links" add constraint "document_links_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);

    this.addSql(`alter table "payments" add constraint "payments_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "payments" add constraint "payments_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "payments" add constraint "payments_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "payments" add constraint "payments_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "payments" add constraint "payments_method_id_foreign" foreign key ("method_id") references "payment_methods" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "payments" add constraint "payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "invoices" add constraint "invoices_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "invoices" add constraint "invoices_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "invoices" add constraint "invoices_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "invoices" add constraint "invoices_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "invoices" add constraint "invoices_payment_method_id_foreign" foreign key ("payment_method_id") references "payment_methods" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "invoices" add constraint "invoices_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "payment_invoice_matches" add constraint "payment_invoice_matches_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "payment_invoice_matches" add constraint "payment_invoice_matches_payment_id_foreign" foreign key ("payment_id") references "payments" ("id") on update cascade;`);
    this.addSql(`alter table "payment_invoice_matches" add constraint "payment_invoice_matches_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;`);

    this.addSql(`alter table "invoice_lines" add constraint "invoice_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "invoice_lines" add constraint "invoice_lines_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;`);
    this.addSql(`alter table "invoice_lines" add constraint "invoice_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "invoice_lines" add constraint "invoice_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "shipments" add constraint "shipments_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "shipments" add constraint "shipments_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade;`);
    this.addSql(`alter table "shipments" add constraint "shipments_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_delivery_method_id_foreign" foreign key ("delivery_method_id") references "delivery_methods" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipments" add constraint "shipments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade;`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "shipment_lines" add constraint "shipment_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "payment_invoice_matches" drop constraint "payment_invoice_matches_payment_id_foreign";`);

    this.addSql(`alter table "payment_invoice_matches" drop constraint "payment_invoice_matches_invoice_id_foreign";`);

    this.addSql(`alter table "invoice_lines" drop constraint "invoice_lines_invoice_id_foreign";`);

    this.addSql(`alter table "shipment_lines" drop constraint "shipment_lines_shipment_id_foreign";`);

    this.addSql(`drop table if exists "document_links" cascade;`);

    this.addSql(`drop table if exists "payments" cascade;`);

    this.addSql(`drop table if exists "invoices" cascade;`);

    this.addSql(`drop table if exists "payment_invoice_matches" cascade;`);

    this.addSql(`drop table if exists "invoice_lines" cascade;`);

    this.addSql(`drop table if exists "shipments" cascade;`);

    this.addSql(`drop table if exists "shipment_lines" cascade;`);
  }

}
