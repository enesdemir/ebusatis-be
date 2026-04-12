import { Migration } from '@mikro-orm/migrations';

export class Migration20260412231044_Sprint12Crm extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "lead_sources" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "code" varchar(255) not null, "name" varchar(255) not null, "is_active" boolean not null default true, constraint "lead_sources_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "lead_sources_tenant_id_index" on "lead_sources" ("tenant_id");`,
    );
    this.addSql(
      `alter table "lead_sources" add constraint "uq_lead_source_code_per_tenant" unique ("tenant_id", "code");`,
    );

    this.addSql(
      `create table "fairs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "name" varchar(255) not null, "venue" varchar(255) null, "city" varchar(255) null, "country" varchar(255) null, "start_date" date not null, "end_date" date not null, "status" text check ("status" in ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')) not null default 'PLANNED', "description" text null, "budget" numeric(14,2) null, "currency" varchar(255) null, constraint "fairs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "fairs_tenant_id_index" on "fairs" ("tenant_id");`,
    );
    this.addSql(`create index "fairs_name_index" on "fairs" ("name");`);

    this.addSql(
      `create table "fair_participants" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "fair_id" uuid not null, "full_name" varchar(255) not null, "company" varchar(255) null, "title" varchar(255) null, "email" varchar(255) null, "phone" varchar(255) null, "notes" text null, "converted_to_lead" boolean not null default false, constraint "fair_participants_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "fair_participants_tenant_id_index" on "fair_participants" ("tenant_id");`,
    );

    this.addSql(
      `create table "leads" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "full_name" varchar(255) not null, "company" varchar(255) null, "email" varchar(255) null, "phone" varchar(255) null, "source_id" uuid null, "fair_id" uuid null, "stage" text check ("stage" in ('NEW', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST')) not null default 'NEW', "estimated_value" numeric(14,2) null, "currency" varchar(255) null, "owner_id" uuid null, "converted_partner_id" uuid null, "converted_at" timestamptz null, "notes" text null, constraint "leads_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "leads_tenant_id_index" on "leads" ("tenant_id");`,
    );
    this.addSql(
      `create index "leads_full_name_index" on "leads" ("full_name");`,
    );
    this.addSql(`create index "leads_stage_index" on "leads" ("stage");`);

    this.addSql(
      `alter table "lead_sources" add constraint "lead_sources_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "fairs" add constraint "fairs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "fair_participants" add constraint "fair_participants_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "fair_participants" add constraint "fair_participants_fair_id_foreign" foreign key ("fair_id") references "fairs" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "leads" add constraint "leads_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "leads" add constraint "leads_source_id_foreign" foreign key ("source_id") references "lead_sources" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "leads" add constraint "leads_fair_id_foreign" foreign key ("fair_id") references "fairs" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "leads" add constraint "leads_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "leads" add constraint "leads_converted_partner_id_foreign" foreign key ("converted_partner_id") references "partners" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "leads" drop constraint "leads_source_id_foreign";`,
    );

    this.addSql(
      `alter table "fair_participants" drop constraint "fair_participants_fair_id_foreign";`,
    );

    this.addSql(`alter table "leads" drop constraint "leads_fair_id_foreign";`);

    this.addSql(`drop table if exists "lead_sources" cascade;`);

    this.addSql(`drop table if exists "fairs" cascade;`);

    this.addSql(`drop table if exists "fair_participants" cascade;`);

    this.addSql(`drop table if exists "leads" cascade;`);
  }
}
