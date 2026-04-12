import { Migration } from '@mikro-orm/migrations';

export class Migration20260405073231 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "audit_logs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "action" text check ("action" in ('LOGIN', 'LOGOUT', 'IMPERSONATE', 'TENANT_CREATED', 'TENANT_UPDATED', 'TENANT_SUSPENDED', 'TENANT_ACTIVATED', 'TENANT_DELETED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSION_CREATED', 'PERMISSION_UPDATED', 'PASSWORD_RESET', 'CONFIG_UPDATED', 'PLAN_CREATED', 'PLAN_UPDATED', 'MODULE_UPDATED')) not null, "actor_id" varchar(255) not null, "actor_email" varchar(255) not null, "tenant_id" varchar(255) null, "tenant_name" varchar(255) null, "ip_address" varchar(255) null, "user_agent" varchar(255) null, "details" jsonb null, "entity_type" varchar(255) null, "entity_id" varchar(255) null, constraint "audit_logs_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "menu_nodes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "code" varchar(255) not null, "label" varchar(255) not null, "icon" varchar(255) null, "path" varchar(255) null, "sort_order" int not null default 0, "scope" text check ("scope" in ('PLATFORM', 'TENANT', 'BOTH')) not null default 'TENANT', "required_permission" varchar(255) null, "has_divider" boolean not null default false, "is_active" boolean not null default true, "parent_id" uuid null, constraint "menu_nodes_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "menu_nodes" add constraint "menu_nodes_code_unique" unique ("code");`,
    );

    this.addSql(
      `create table "permissions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "slug" varchar(255) not null, "category" varchar(255) not null, "assignable_scope" varchar(255) not null default 'TENANT', "description" varchar(255) null, constraint "permissions_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "permissions" add constraint "permissions_slug_unique" unique ("slug");`,
    );

    this.addSql(
      `create table "platform_configs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "key" varchar(255) not null, "value" text not null, "category" text check ("category" in ('GENERAL', 'SECURITY', 'NOTIFICATIONS', 'BILLING')) not null default 'GENERAL', "description" varchar(255) null, "value_type" varchar(255) not null default 'string', constraint "platform_configs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "platform_configs" add constraint "platform_configs_key_unique" unique ("key");`,
    );

    this.addSql(
      `create table "tenants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "domain" varchar(255) not null, "type" text check ("type" in ('SAAS', 'ON_PREM_LICENSE')) not null default 'SAAS', "subscription_status" text check ("subscription_status" in ('ACTIVE', 'SUSPENDED', 'TRIAL')) not null default 'ACTIVE', "features" jsonb not null, constraint "tenants_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "tenants" add constraint "tenants_domain_unique" unique ("domain");`,
    );

    this.addSql(
      `create table "tax_rates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "rate" numeric(5,2) not null, "type" text check ("type" in ('VAT', 'WITHHOLDING', 'CUSTOMS', 'EXEMPT')) not null default 'VAT', "is_default" boolean not null default false, "is_inclusive" boolean not null default false, constraint "tax_rates_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "tax_rates_tenant_id_index" on "tax_rates" ("tenant_id");`,
    );
    this.addSql(
      `alter table "tax_rates" add constraint "tax_rates_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "tags" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "color" varchar(255) not null, "icon" varchar(255) null, "entity_types" jsonb not null default '[]', constraint "tags_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "tags_tenant_id_index" on "tags" ("tenant_id");`);
    this.addSql(
      `alter table "tags" add constraint "tags_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "status_definitions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "entity_type" text check ("entity_type" in ('ORDER', 'INVOICE', 'PURCHASE', 'PRODUCTION', 'SHIPMENT')) not null, "color" varchar(255) not null, "icon" varchar(255) null, "is_final" boolean not null default false, "is_default" boolean not null default false, "allowed_transitions" jsonb not null default '[]', constraint "status_definitions_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "status_definitions_tenant_id_index" on "status_definitions" ("tenant_id");`,
    );
    this.addSql(
      `alter table "status_definitions" add constraint "status_definitions_tenant_id_code_entity_type_unique" unique ("tenant_id", "code", "entity_type");`,
    );

    this.addSql(
      `create table "roles" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(255) not null, "is_system_role" boolean not null default false, "tenant_id" uuid null, constraint "roles_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "roles_permissions" ("role_id" uuid not null, "permission_id" uuid not null, constraint "roles_permissions_pkey" primary key ("role_id", "permission_id"));`,
    );

    this.addSql(
      `create table "payment_methods" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "type" text check ("type" in ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'DEFERRED', 'OFFSET')) not null, "icon" varchar(255) null, "requires_reference" boolean not null default false, "default_due_days" int null, constraint "payment_methods_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "payment_methods_tenant_id_index" on "payment_methods" ("tenant_id");`,
    );
    this.addSql(
      `alter table "payment_methods" add constraint "payment_methods_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "document_links" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "source_type" varchar(255) not null, "source_id" varchar(255) not null, "target_type" varchar(255) not null, "target_id" varchar(255) not null, "link_type" text check ("link_type" in ('CREATED_FROM', 'PARTIAL', 'RETURN', 'CORRECTION')) not null default 'CREATED_FROM', constraint "document_links_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "document_links_tenant_id_index" on "document_links" ("tenant_id");`,
    );

    this.addSql(
      `create table "delivery_methods" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "type" text check ("type" in ('CARGO', 'PICKUP', 'OWN_VEHICLE', 'COURIER', 'FREIGHT')) not null, "icon" varchar(255) null, "default_cost" numeric(10,2) null, "estimated_days" int null, constraint "delivery_methods_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "delivery_methods_tenant_id_index" on "delivery_methods" ("tenant_id");`,
    );
    this.addSql(
      `alter table "delivery_methods" add constraint "delivery_methods_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "currencies" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "symbol" varchar(255) not null, "decimal_places" int not null default 2, "is_default" boolean not null default false, "position" text check ("position" in ('PREFIX', 'SUFFIX')) not null default 'SUFFIX', constraint "currencies_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "currencies_tenant_id_index" on "currencies" ("tenant_id");`,
    );
    this.addSql(
      `alter table "currencies" add constraint "currencies_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "partners" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "types" jsonb not null default '[]', "tax_id" varchar(255) null, "email" varchar(255) null, "phone" varchar(255) null, "website" varchar(255) null, "default_currency_id" uuid null, "credit_limit" numeric(14,2) not null default 0, "risk_score" text check ("risk_score" in ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED')) not null default 'LOW', "is_active" boolean not null default true, "note" text null, constraint "partners_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "partners_tenant_id_index" on "partners" ("tenant_id");`,
    );
    this.addSql(`create index "partners_code_index" on "partners" ("code");`);

    this.addSql(
      `create table "supplier_price_lists" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "supplier_id" uuid not null, "name" varchar(255) not null, "currency_id" uuid null, "valid_from" date null, "valid_to" date null, "is_active" boolean not null default true, constraint "supplier_price_lists_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "supplier_price_lists_tenant_id_index" on "supplier_price_lists" ("tenant_id");`,
    );

    this.addSql(
      `create table "partners_tags" ("partner_id" uuid not null, "tag_id" uuid not null, constraint "partners_tags_pkey" primary key ("partner_id", "tag_id"));`,
    );

    this.addSql(
      `create table "partner_contacts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "full_name" varchar(255) not null, "title" varchar(255) null, "phone" varchar(255) null, "email" varchar(255) null, "is_primary" boolean not null default false, "note" text null, constraint "partner_contacts_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "partner_contacts_tenant_id_index" on "partner_contacts" ("tenant_id");`,
    );

    this.addSql(
      `create table "partner_addresses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "type" text check ("type" in ('BILLING', 'SHIPPING', 'BOTH')) not null default 'BOTH', "label" varchar(255) null, "address_line1" varchar(255) null, "address_line2" varchar(255) null, "city" varchar(255) null, "district" varchar(255) null, "postal_code" varchar(255) null, "country" varchar(255) null, "is_default" boolean not null default false, constraint "partner_addresses_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "partner_addresses_tenant_id_index" on "partner_addresses" ("tenant_id");`,
    );

    this.addSql(
      `create table "exchange_rates" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "from_currency_id" uuid not null, "to_currency_id" uuid not null, "rate" numeric(18,6) not null, "effective_date" date not null, "source" text check ("source" in ('MANUAL', 'API')) not null default 'MANUAL', constraint "exchange_rates_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "exchange_rates_tenant_id_index" on "exchange_rates" ("tenant_id");`,
    );

    this.addSql(
      `create table "counterparties" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "legal_name" varchar(255) not null, "tax_id" varchar(255) null, "tax_office" varchar(255) null, "type" text check ("type" in ('INDIVIDUAL', 'COMPANY')) not null default 'COMPANY', "is_default" boolean not null default false, "is_active" boolean not null default true, constraint "counterparties_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "counterparties_tenant_id_index" on "counterparties" ("tenant_id");`,
    );

    this.addSql(
      `create table "categories" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "parent_id" uuid null, "icon" varchar(255) null, "color" varchar(255) null, "depth" int not null default 0, constraint "categories_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "categories_tenant_id_index" on "categories" ("tenant_id");`,
    );
    this.addSql(
      `alter table "categories" add constraint "categories_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "bank_accounts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "counterparty_id" uuid not null, "bank_name" varchar(255) not null, "iban" varchar(255) not null, "currency_id" uuid null, "account_holder" varchar(255) null, "is_default" boolean not null default false, constraint "bank_accounts_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "bank_accounts_tenant_id_index" on "bank_accounts" ("tenant_id");`,
    );

    this.addSql(
      `create table "attributes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "type" text check ("type" in ('STRING', 'NUMBER', 'BOOLEAN')) not null, constraint "attributes_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "attributes_tenant_id_index" on "attributes" ("tenant_id");`,
    );

    this.addSql(
      `create table "units_of_measure" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "category" text check ("category" in ('LENGTH', 'WEIGHT', 'AREA', 'PIECE', 'VOLUME')) not null, "symbol" varchar(255) not null, "base_conversion_factor" numeric(10,6) not null default 1, "decimal_precision" int not null default 2, "is_base_unit" boolean not null default false, constraint "units_of_measure_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "units_of_measure_tenant_id_index" on "units_of_measure" ("tenant_id");`,
    );
    this.addSql(
      `alter table "units_of_measure" add constraint "units_of_measure_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "products" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "description" text null, "category_id" uuid null, "unit_id" uuid null, "tax_rate_id" uuid null, "tracking_strategy" text check ("tracking_strategy" in ('SERIAL', 'BULK')) not null default 'SERIAL', "fabric_composition" varchar(255) null, "washing_instructions" varchar(255) null, "collection_name" varchar(255) null, "moq" numeric(10,2) null, "origin" varchar(255) null, "is_active" boolean not null default true, constraint "products_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "products_tenant_id_index" on "products" ("tenant_id");`,
    );
    this.addSql(`create index "products_code_index" on "products" ("code");`);

    this.addSql(
      `create table "product_variants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "sku" varchar(255) not null, "product_id" uuid not null, "price" numeric(10,2) not null default 0, "cost_price" numeric(10,2) null, "currency_id" uuid null, "min_order_quantity" numeric(10,2) null, "color_code" varchar(255) null, "width" numeric(10,2) null, "weight" numeric(10,2) null, "martindale" int null, "primary_image_url" varchar(255) null, "barcode" varchar(255) null, "is_active" boolean not null default true, constraint "product_variants_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "product_variants_tenant_id_index" on "product_variants" ("tenant_id");`,
    );
    this.addSql(
      `create index "product_variants_sku_index" on "product_variants" ("sku");`,
    );

    this.addSql(
      `create table "supplier_price_list_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "price_list_id" uuid not null, "variant_id" uuid not null, "unit_price" numeric(10,2) not null, "moq" numeric(10,2) null, "lead_time_days" int null, "note" text null, constraint "supplier_price_list_items_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "supplier_price_list_items_tenant_id_index" on "supplier_price_list_items" ("tenant_id");`,
    );

    this.addSql(
      `create table "product_variant_attribute_values" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "variant_id" uuid not null, "attribute_id" uuid not null, "value_string" varchar(255) null, "value_number" numeric(10,2) null, "value_boolean" boolean null, constraint "product_variant_attribute_values_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "products_tags" ("product_id" uuid not null, "tag_id" uuid not null, constraint "products_tags_pkey" primary key ("product_id", "tag_id"));`,
    );

    this.addSql(
      `create table "product_attribute_values" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "product_id" uuid not null, "attribute_id" uuid not null, "value_string" varchar(255) null, "value_number" numeric(10,2) null, "value_boolean" boolean null, constraint "product_attribute_values_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "is_super_admin" boolean not null default false, "is_tenant_owner" boolean not null default false, "is_active" boolean not null default true, "locale" varchar(255) not null default 'tr', "last_login_at" timestamptz null, "tenant_id" uuid null, constraint "users_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "purchase_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "supplier_id" uuid not null, "counterparty_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "status_id" uuid null, "expected_delivery_date" date null, "total_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "container_info" jsonb null, "note" text null, "created_by_id" uuid not null, constraint "purchase_orders_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "purchase_orders_tenant_id_index" on "purchase_orders" ("tenant_id");`,
    );
    this.addSql(
      `create index "purchase_orders_order_number_index" on "purchase_orders" ("order_number");`,
    );

    this.addSql(
      `create table "purchase_order_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_id" uuid not null, "variant_id" uuid not null, "quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "received_quantity" numeric(10,2) not null default 0, "note" text null, constraint "purchase_order_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "purchase_order_lines_tenant_id_index" on "purchase_order_lines" ("tenant_id");`,
    );

    this.addSql(
      `create table "payments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "payment_number" varchar(255) not null, "direction" text check ("direction" in ('INCOMING', 'OUTGOING')) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "amount" numeric(14,2) not null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "payment_date" date not null, "method_id" uuid null, "reference" varchar(255) null, "bank_account" varchar(255) null, "status" text check ("status" in ('PENDING', 'COMPLETED', 'CANCELLED')) not null default 'COMPLETED', "note" text null, "created_by_id" uuid not null, constraint "payments_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "payments_tenant_id_index" on "payments" ("tenant_id");`,
    );
    this.addSql(
      `create index "payments_payment_number_index" on "payments" ("payment_number");`,
    );

    this.addSql(
      `create table "partner_reps" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "user_id" uuid not null, "role" text check ("role" in ('METRAJ_REP', 'KESIM_REP', 'HAZIR_URUN_REP', 'GENERAL')) not null default 'GENERAL', "is_primary" boolean not null default false, constraint "partner_reps_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "partner_reps_tenant_id_index" on "partner_reps" ("tenant_id");`,
    );

    this.addSql(
      `create table "invoices" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "invoice_number" varchar(255) not null, "type" text check ("type" in ('SALES', 'PURCHASE', 'RETURN_SALES', 'RETURN_PURCHASE')) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "issue_date" date not null, "due_date" date null, "status" text check ("status" in ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE')) not null default 'DRAFT', "subtotal" numeric(14,2) not null default 0, "discount_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "paid_amount" numeric(14,2) not null default 0, "payment_method_id" uuid null, "note" text null, "source_order_id" varchar(255) null, "created_by_id" uuid not null, constraint "invoices_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "invoices_tenant_id_index" on "invoices" ("tenant_id");`,
    );
    this.addSql(
      `create index "invoices_invoice_number_index" on "invoices" ("invoice_number");`,
    );

    this.addSql(
      `create table "payment_invoice_matches" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "payment_id" uuid not null, "invoice_id" uuid not null, "matched_amount" numeric(14,2) not null, "matched_at" timestamptz not null, constraint "payment_invoice_matches_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "payment_invoice_matches_tenant_id_index" on "payment_invoice_matches" ("tenant_id");`,
    );

    this.addSql(
      `create table "invoice_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "invoice_id" uuid not null, "description" varchar(255) not null, "variant_id" uuid null, "quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "discount" numeric(5,2) not null default 0, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "source_order_line_id" varchar(255) null, constraint "invoice_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "invoice_lines_tenant_id_index" on "invoice_lines" ("tenant_id");`,
    );

    this.addSql(
      `create table "interactions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "type" text check ("type" in ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'VISIT', 'OFFER')) not null, "summary" varchar(255) not null, "details" text null, "contact_person" varchar(255) null, "next_action_date" date null, "next_action_note" varchar(255) null, "created_by_id" uuid not null, constraint "interactions_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "interactions_tenant_id_index" on "interactions" ("tenant_id");`,
    );

    this.addSql(
      `create table "digital_catalogs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "title" varchar(255) not null, "token" varchar(255) not null, "show_prices" boolean not null default true, "show_stock" boolean not null default false, "expires_at" timestamptz null, "view_count" int not null default 0, "is_active" boolean not null default true, "created_by_id" uuid not null, "partner_id" varchar(255) null, constraint "digital_catalogs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "digital_catalogs_tenant_id_index" on "digital_catalogs" ("tenant_id");`,
    );
    this.addSql(
      `alter table "digital_catalogs" add constraint "digital_catalogs_token_unique" unique ("token");`,
    );

    this.addSql(
      `create table "digital_catalog_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "catalog_id" uuid not null, "variant_id" uuid not null, "custom_price" numeric(10,2) null, "note" text null, "sort_order" int not null default 0, constraint "digital_catalog_items_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "digital_catalog_items_tenant_id_index" on "digital_catalog_items" ("tenant_id");`,
    );

    this.addSql(
      `create table "users_roles" ("user_id" uuid not null, "role_id" uuid not null, constraint "users_roles_pkey" primary key ("user_id", "role_id"));`,
    );

    this.addSql(
      `create table "warehouses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "description" text null, "is_active" boolean not null default true, "sort_order" int not null default 0, "scope" text check ("scope" in ('SYSTEM_SEED', 'TENANT')) not null default 'TENANT', "address" varchar(255) null, "city" varchar(255) null, "country" varchar(255) null, "type" text check ("type" in ('MAIN', 'TRANSIT', 'RETURN', 'PRODUCTION', 'CONSIGNMENT')) not null default 'MAIN', "is_default" boolean not null default false, "legal_entity" varchar(255) null, "manager_id" uuid null, constraint "warehouses_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "warehouses_tenant_id_index" on "warehouses" ("tenant_id");`,
    );
    this.addSql(
      `alter table "warehouses" add constraint "warehouses_tenant_id_code_unique" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "sales_orders" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_number" varchar(255) not null, "partner_id" uuid not null, "counterparty_id" uuid null, "warehouse_id" uuid null, "currency_id" uuid null, "exchange_rate" numeric(18,6) null, "status_id" uuid null, "order_date" date not null, "expected_delivery_date" date null, "payment_method_id" uuid null, "delivery_method_id" uuid null, "total_amount" numeric(14,2) not null default 0, "discount_amount" numeric(14,2) not null default 0, "tax_amount" numeric(14,2) not null default 0, "grand_total" numeric(14,2) not null default 0, "note" text null, "internal_note" text null, "assigned_to_id" uuid null, "created_by_id" uuid not null, constraint "sales_orders_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "sales_orders_tenant_id_index" on "sales_orders" ("tenant_id");`,
    );
    this.addSql(
      `create index "sales_orders_order_number_index" on "sales_orders" ("order_number");`,
    );

    this.addSql(
      `create table "shipments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_number" varchar(255) not null, "sales_order_id" uuid not null, "warehouse_id" uuid null, "delivery_method_id" uuid null, "status" text check ("status" in ('PREPARING', 'SHIPPED', 'DELIVERED', 'RETURNED')) not null default 'PREPARING', "tracking_number" varchar(255) null, "shipped_at" timestamptz null, "delivered_at" timestamptz null, "note" text null, "created_by_id" uuid not null, constraint "shipments_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "shipments_tenant_id_index" on "shipments" ("tenant_id");`,
    );
    this.addSql(
      `create index "shipments_shipment_number_index" on "shipments" ("shipment_number");`,
    );

    this.addSql(
      `create table "sales_order_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_id" uuid not null, "line_number" int not null default 1, "variant_id" uuid not null, "requested_quantity" numeric(10,2) not null, "unit_price" numeric(10,2) not null, "discount" numeric(5,2) not null default 0, "tax_rate_id" uuid null, "line_total" numeric(14,2) not null default 0, "note" text null, constraint "sales_order_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "sales_order_lines_tenant_id_index" on "sales_order_lines" ("tenant_id");`,
    );

    this.addSql(
      `create table "shipment_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_id" uuid not null, "order_line_id" uuid null, "variant_id" uuid not null, "quantity" numeric(10,2) not null, "note" text null, "roll_ids" jsonb not null default '[]', constraint "shipment_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "shipment_lines_tenant_id_index" on "shipment_lines" ("tenant_id");`,
    );

    this.addSql(
      `create table "sales_orders_tags" ("sales_order_id" uuid not null, "tag_id" uuid not null, constraint "sales_orders_tags_pkey" primary key ("sales_order_id", "tag_id"));`,
    );

    this.addSql(
      `create table "goods_receives" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "receive_number" varchar(255) not null, "supplier_id" uuid not null, "warehouse_id" uuid not null, "purchase_order_id" varchar(255) null, "received_at" timestamptz not null, "status" text check ("status" in ('DRAFT', 'COMPLETED', 'CANCELLED')) not null default 'DRAFT', "note" text null, "created_by_id" uuid not null, constraint "goods_receives_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "goods_receives_tenant_id_index" on "goods_receives" ("tenant_id");`,
    );

    this.addSql(
      `create table "goods_receive_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "goods_receive_id" uuid not null, "variant_id" uuid not null, "expected_quantity" numeric(10,2) null, "received_roll_count" int not null default 0, "total_received_quantity" numeric(10,2) not null default 0, "note" text null, constraint "goods_receive_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "goods_receive_lines_tenant_id_index" on "goods_receive_lines" ("tenant_id");`,
    );

    this.addSql(
      `create table "warehouse_locations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "warehouse_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) not null, "type" text check ("type" in ('ZONE', 'AISLE', 'SHELF', 'BIN', 'FLOOR')) not null default 'SHELF', "parent_id" uuid null, "capacity" jsonb null, "is_active" boolean not null default true, "sort_order" int not null default 0, constraint "warehouse_locations_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "warehouse_locations_tenant_id_index" on "warehouse_locations" ("tenant_id");`,
    );
    this.addSql(
      `alter table "warehouse_locations" add constraint "warehouse_locations_warehouse_id_code_unique" unique ("warehouse_id", "code");`,
    );

    this.addSql(
      `create table "inventory_items" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "variant_id" uuid not null, "barcode" varchar(255) not null, "batch_code" varchar(255) null, "initial_quantity" numeric(10,2) not null, "current_quantity" numeric(10,2) not null, "reserved_quantity" numeric(10,2) not null default 0, "warehouse_id" uuid null, "location_id" uuid null, "cost_price" numeric(10,2) null, "cost_currency_id" uuid null, "received_from_id" uuid null, "received_at" timestamptz null, "goods_receive_id" varchar(255) null, "status" text check ("status" in ('IN_STOCK', 'RESERVED', 'SOLD', 'CONSUMED', 'LOST', 'WASTE')) not null default 'IN_STOCK', "expires_at" timestamptz null, constraint "inventory_items_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "inventory_items_tenant_id_index" on "inventory_items" ("tenant_id");`,
    );
    this.addSql(
      `create index "inventory_items_barcode_index" on "inventory_items" ("barcode");`,
    );
    this.addSql(
      `create index "inventory_items_batch_code_index" on "inventory_items" ("batch_code");`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_tenant_id_barcode_unique" unique ("tenant_id", "barcode");`,
    );

    this.addSql(
      `create table "order_roll_allocations" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "order_line_id" uuid not null, "roll_id" uuid not null, "allocated_quantity" numeric(10,2) not null, "status" text check ("status" in ('RESERVED', 'CUT', 'CANCELLED')) not null default 'RESERVED', "cut_at" timestamptz null, constraint "order_roll_allocations_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "order_roll_allocations_tenant_id_index" on "order_roll_allocations" ("tenant_id");`,
    );

    this.addSql(
      `create table "inventory_transactions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "item_id" uuid not null, "type" text check ("type" in ('PURCHASE', 'SALE_CUT', 'WASTE', 'ADJUSTMENT', 'RETURN')) not null, "quantity_change" numeric(10,2) not null, "previous_quantity" numeric(10,2) not null, "new_quantity" numeric(10,2) not null, "reference_id" varchar(255) null, "note" varchar(255) null, "created_by_id" uuid null, constraint "inventory_transactions_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "menu_nodes" add constraint "menu_nodes_parent_id_foreign" foreign key ("parent_id") references "menu_nodes" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "tax_rates" add constraint "tax_rates_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "tags" add constraint "tags_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "status_definitions" add constraint "status_definitions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "roles" add constraint "roles_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "roles_permissions" add constraint "roles_permissions_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "roles_permissions" add constraint "roles_permissions_permission_id_foreign" foreign key ("permission_id") references "permissions" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "payment_methods" add constraint "payment_methods_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "document_links" add constraint "document_links_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "delivery_methods" add constraint "delivery_methods_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "currencies" add constraint "currencies_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "partners" add constraint "partners_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "partners" add constraint "partners_default_currency_id_foreign" foreign key ("default_currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "supplier_price_lists" add constraint "supplier_price_lists_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_price_lists" add constraint "supplier_price_lists_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_price_lists" add constraint "supplier_price_lists_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "partners_tags" add constraint "partners_tags_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "partners_tags" add constraint "partners_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "partner_contacts" add constraint "partner_contacts_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "partner_contacts" add constraint "partner_contacts_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "partner_addresses" add constraint "partner_addresses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "partner_addresses" add constraint "partner_addresses_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "exchange_rates" add constraint "exchange_rates_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "exchange_rates" add constraint "exchange_rates_from_currency_id_foreign" foreign key ("from_currency_id") references "currencies" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "exchange_rates" add constraint "exchange_rates_to_currency_id_foreign" foreign key ("to_currency_id") references "currencies" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "counterparties" add constraint "counterparties_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "counterparties" add constraint "counterparties_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "categories" add constraint "categories_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "categories" add constraint "categories_parent_id_foreign" foreign key ("parent_id") references "categories" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "bank_accounts" add constraint "bank_accounts_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bank_accounts" add constraint "bank_accounts_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "bank_accounts" add constraint "bank_accounts_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "attributes" add constraint "attributes_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "units_of_measure" add constraint "units_of_measure_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "products" add constraint "products_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "products" add constraint "products_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "products" add constraint "products_unit_id_foreign" foreign key ("unit_id") references "units_of_measure" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "products" add constraint "products_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "product_variants" add constraint "product_variants_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "product_variants" add constraint "product_variants_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "product_variants" add constraint "product_variants_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "supplier_price_list_items" add constraint "supplier_price_list_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_price_list_items" add constraint "supplier_price_list_items_price_list_id_foreign" foreign key ("price_list_id") references "supplier_price_lists" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "supplier_price_list_items" add constraint "supplier_price_list_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "product_variant_attribute_values" add constraint "product_variant_attribute_values_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "product_variant_attribute_values" add constraint "product_variant_attribute_values_attribute_id_foreign" foreign key ("attribute_id") references "attributes" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "products_tags" add constraint "products_tags_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "products_tags" add constraint "products_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "product_attribute_values" add constraint "product_attribute_values_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "product_attribute_values" add constraint "product_attribute_values_attribute_id_foreign" foreign key ("attribute_id") references "attributes" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "users" add constraint "users_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_status_id_foreign" foreign key ("status_id") references "status_definitions" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "purchase_order_lines" add constraint "purchase_order_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "purchase_order_lines" add constraint "purchase_order_lines_order_id_foreign" foreign key ("order_id") references "purchase_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "purchase_order_lines" add constraint "purchase_order_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "purchase_order_lines" add constraint "purchase_order_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "payments" add constraint "payments_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_method_id_foreign" foreign key ("method_id") references "payment_methods" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "payments" add constraint "payments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "partner_reps" add constraint "partner_reps_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "partner_reps" add constraint "partner_reps_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "partner_reps" add constraint "partner_reps_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "invoices" add constraint "invoices_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "invoices" add constraint "invoices_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "invoices" add constraint "invoices_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "invoices" add constraint "invoices_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "invoices" add constraint "invoices_payment_method_id_foreign" foreign key ("payment_method_id") references "payment_methods" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "invoices" add constraint "invoices_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "payment_invoice_matches" add constraint "payment_invoice_matches_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payment_invoice_matches" add constraint "payment_invoice_matches_payment_id_foreign" foreign key ("payment_id") references "payments" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "payment_invoice_matches" add constraint "payment_invoice_matches_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "invoice_lines" add constraint "invoice_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "invoice_lines" add constraint "invoice_lines_invoice_id_foreign" foreign key ("invoice_id") references "invoices" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "invoice_lines" add constraint "invoice_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "invoice_lines" add constraint "invoice_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "interactions" add constraint "interactions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "interactions" add constraint "interactions_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "interactions" add constraint "interactions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "digital_catalogs" add constraint "digital_catalogs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "digital_catalogs" add constraint "digital_catalogs_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "digital_catalog_items" add constraint "digital_catalog_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "digital_catalog_items" add constraint "digital_catalog_items_catalog_id_foreign" foreign key ("catalog_id") references "digital_catalogs" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "digital_catalog_items" add constraint "digital_catalog_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "users_roles" add constraint "users_roles_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "users_roles" add constraint "users_roles_role_id_foreign" foreign key ("role_id") references "roles" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "warehouses" add constraint "warehouses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "warehouses" add constraint "warehouses_manager_id_foreign" foreign key ("manager_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_status_id_foreign" foreign key ("status_id") references "status_definitions" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_payment_method_id_foreign" foreign key ("payment_method_id") references "payment_methods" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_delivery_method_id_foreign" foreign key ("delivery_method_id") references "delivery_methods" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_assigned_to_id_foreign" foreign key ("assigned_to_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "sales_orders" add constraint "sales_orders_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "shipments" add constraint "shipments_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "shipments" add constraint "shipments_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "shipments" add constraint "shipments_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "shipments" add constraint "shipments_delivery_method_id_foreign" foreign key ("delivery_method_id") references "delivery_methods" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "shipments" add constraint "shipments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "sales_order_lines" add constraint "sales_order_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sales_order_lines" add constraint "sales_order_lines_order_id_foreign" foreign key ("order_id") references "sales_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sales_order_lines" add constraint "sales_order_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "sales_order_lines" add constraint "sales_order_lines_tax_rate_id_foreign" foreign key ("tax_rate_id") references "tax_rates" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "shipment_lines" add constraint "shipment_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "shipment_lines" add constraint "shipment_lines_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "shipment_lines" add constraint "shipment_lines_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "shipment_lines" add constraint "shipment_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "sales_orders_tags" add constraint "sales_orders_tags_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "sales_orders_tags" add constraint "sales_orders_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_supplier_id_foreign" foreign key ("supplier_id") references "partners" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "goods_receives" add constraint "goods_receives_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "goods_receive_lines" add constraint "goods_receive_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "goods_receive_lines" add constraint "goods_receive_lines_goods_receive_id_foreign" foreign key ("goods_receive_id") references "goods_receives" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "goods_receive_lines" add constraint "goods_receive_lines_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "warehouse_locations" add constraint "warehouse_locations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "warehouse_locations" add constraint "warehouse_locations_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "warehouse_locations" add constraint "warehouse_locations_parent_id_foreign" foreign key ("parent_id") references "warehouse_locations" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_variant_id_foreign" foreign key ("variant_id") references "product_variants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_warehouse_id_foreign" foreign key ("warehouse_id") references "warehouses" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_location_id_foreign" foreign key ("location_id") references "warehouse_locations" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_cost_currency_id_foreign" foreign key ("cost_currency_id") references "currencies" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "inventory_items" add constraint "inventory_items_received_from_id_foreign" foreign key ("received_from_id") references "partners" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "order_roll_allocations" add constraint "order_roll_allocations_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "order_roll_allocations" add constraint "order_roll_allocations_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "order_roll_allocations" add constraint "order_roll_allocations_roll_id_foreign" foreign key ("roll_id") references "inventory_items" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "inventory_transactions" add constraint "inventory_transactions_item_id_foreign" foreign key ("item_id") references "inventory_items" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "inventory_transactions" add constraint "inventory_transactions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete set null;`,
    );
  }
}
