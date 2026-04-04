import { Migration } from '@mikro-orm/migrations';

export class Migration20260404175736_partners extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "partners" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "code" varchar(255) null, "types" jsonb not null default '[]', "tax_id" varchar(255) null, "email" varchar(255) null, "phone" varchar(255) null, "website" varchar(255) null, "default_currency_id" uuid null, "credit_limit" numeric(14,2) not null default 0, "risk_score" text check ("risk_score" in ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED')) not null default 'LOW', "is_active" boolean not null default true, "note" text null, constraint "partners_pkey" primary key ("id"));`);
    this.addSql(`create index "partners_tenant_id_index" on "partners" ("tenant_id");`);
    this.addSql(`create index "partners_code_index" on "partners" ("code");`);

    this.addSql(`create table "partners_tags" ("partner_id" uuid not null, "tag_id" uuid not null, constraint "partners_tags_pkey" primary key ("partner_id", "tag_id"));`);

    this.addSql(`create table "partner_contacts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "full_name" varchar(255) not null, "title" varchar(255) null, "phone" varchar(255) null, "email" varchar(255) null, "is_primary" boolean not null default false, "note" text null, constraint "partner_contacts_pkey" primary key ("id"));`);
    this.addSql(`create index "partner_contacts_tenant_id_index" on "partner_contacts" ("tenant_id");`);

    this.addSql(`create table "partner_addresses" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "type" text check ("type" in ('BILLING', 'SHIPPING', 'BOTH')) not null default 'BOTH', "label" varchar(255) null, "address_line1" varchar(255) null, "address_line2" varchar(255) null, "city" varchar(255) null, "district" varchar(255) null, "postal_code" varchar(255) null, "country" varchar(255) null, "is_default" boolean not null default false, constraint "partner_addresses_pkey" primary key ("id"));`);
    this.addSql(`create index "partner_addresses_tenant_id_index" on "partner_addresses" ("tenant_id");`);

    this.addSql(`create table "counterparties" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "legal_name" varchar(255) not null, "tax_id" varchar(255) null, "tax_office" varchar(255) null, "type" text check ("type" in ('INDIVIDUAL', 'COMPANY')) not null default 'COMPANY', "is_default" boolean not null default false, "is_active" boolean not null default true, constraint "counterparties_pkey" primary key ("id"));`);
    this.addSql(`create index "counterparties_tenant_id_index" on "counterparties" ("tenant_id");`);

    this.addSql(`create table "bank_accounts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "counterparty_id" uuid not null, "bank_name" varchar(255) not null, "iban" varchar(255) not null, "currency_id" uuid null, "account_holder" varchar(255) null, "is_default" boolean not null default false, constraint "bank_accounts_pkey" primary key ("id"));`);
    this.addSql(`create index "bank_accounts_tenant_id_index" on "bank_accounts" ("tenant_id");`);

    this.addSql(`create table "partner_reps" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "user_id" uuid not null, "role" text check ("role" in ('METRAJ_REP', 'KESIM_REP', 'HAZIR_URUN_REP', 'GENERAL')) not null default 'GENERAL', "is_primary" boolean not null default false, constraint "partner_reps_pkey" primary key ("id"));`);
    this.addSql(`create index "partner_reps_tenant_id_index" on "partner_reps" ("tenant_id");`);

    this.addSql(`create table "interactions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "partner_id" uuid not null, "type" text check ("type" in ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'VISIT', 'OFFER')) not null, "summary" varchar(255) not null, "details" text null, "contact_person" varchar(255) null, "next_action_date" date null, "next_action_note" varchar(255) null, "created_by_id" uuid not null, constraint "interactions_pkey" primary key ("id"));`);
    this.addSql(`create index "interactions_tenant_id_index" on "interactions" ("tenant_id");`);

    this.addSql(`alter table "partners" add constraint "partners_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "partners" add constraint "partners_default_currency_id_foreign" foreign key ("default_currency_id") references "currencies" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "partners_tags" add constraint "partners_tags_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "partners_tags" add constraint "partners_tags_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "partner_contacts" add constraint "partner_contacts_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "partner_contacts" add constraint "partner_contacts_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);

    this.addSql(`alter table "partner_addresses" add constraint "partner_addresses_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "partner_addresses" add constraint "partner_addresses_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);

    this.addSql(`alter table "counterparties" add constraint "counterparties_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "counterparties" add constraint "counterparties_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);

    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_counterparty_id_foreign" foreign key ("counterparty_id") references "counterparties" ("id") on update cascade;`);
    this.addSql(`alter table "bank_accounts" add constraint "bank_accounts_currency_id_foreign" foreign key ("currency_id") references "currencies" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "partner_reps" add constraint "partner_reps_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "partner_reps" add constraint "partner_reps_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "partner_reps" add constraint "partner_reps_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "interactions" add constraint "interactions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`);
    this.addSql(`alter table "interactions" add constraint "interactions_partner_id_foreign" foreign key ("partner_id") references "partners" ("id") on update cascade;`);
    this.addSql(`alter table "interactions" add constraint "interactions_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "partners_tags" drop constraint "partners_tags_partner_id_foreign";`);

    this.addSql(`alter table "partner_contacts" drop constraint "partner_contacts_partner_id_foreign";`);

    this.addSql(`alter table "partner_addresses" drop constraint "partner_addresses_partner_id_foreign";`);

    this.addSql(`alter table "counterparties" drop constraint "counterparties_partner_id_foreign";`);

    this.addSql(`alter table "partner_reps" drop constraint "partner_reps_partner_id_foreign";`);

    this.addSql(`alter table "interactions" drop constraint "interactions_partner_id_foreign";`);

    this.addSql(`alter table "bank_accounts" drop constraint "bank_accounts_counterparty_id_foreign";`);

    this.addSql(`drop table if exists "partners" cascade;`);

    this.addSql(`drop table if exists "partners_tags" cascade;`);

    this.addSql(`drop table if exists "partner_contacts" cascade;`);

    this.addSql(`drop table if exists "partner_addresses" cascade;`);

    this.addSql(`drop table if exists "counterparties" cascade;`);

    this.addSql(`drop table if exists "bank_accounts" cascade;`);

    this.addSql(`drop table if exists "partner_reps" cascade;`);

    this.addSql(`drop table if exists "interactions" cascade;`);
  }

}
