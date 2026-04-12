import { Migration } from '@mikro-orm/migrations';

export class Migration20260412214026 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "approval_workflows" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "code" varchar(255) not null, "name" varchar(255) not null, "entity_type" text check ("entity_type" in ('PURCHASE_ORDER', 'SALES_ORDER', 'SUPPLIER_CLAIM')) not null, "is_active" boolean not null default true, "description" text null, constraint "approval_workflows_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "approval_workflows_tenant_id_index" on "approval_workflows" ("tenant_id");`,
    );
    this.addSql(
      `create index "approval_workflows_code_index" on "approval_workflows" ("code");`,
    );
    this.addSql(
      `create index "approval_workflows_entity_type_index" on "approval_workflows" ("entity_type");`,
    );

    this.addSql(
      `create table "approval_steps" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "workflow_id" uuid not null, "step_order" int not null, "name" varchar(255) not null, "min_amount" numeric(14,2) not null default 0, "max_amount" numeric(14,2) null, "approver_role_code" varchar(255) null, "approver_group_code" varchar(255) null, "timeout_hours" int null, "require_all" boolean not null default false, constraint "approval_steps_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "approval_steps_tenant_id_index" on "approval_steps" ("tenant_id");`,
    );
    this.addSql(
      `create index "approval_steps_workflow_id_index" on "approval_steps" ("workflow_id");`,
    );

    this.addSql(
      `create table "approval_requests" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "workflow_id" uuid not null, "entity_type" text check ("entity_type" in ('PURCHASE_ORDER', 'SALES_ORDER', 'SUPPLIER_CLAIM')) not null, "entity_id" varchar(255) not null, "entity_ref" varchar(255) null, "amount" numeric(14,2) null, "currency_code" varchar(255) null, "status" text check ("status" in ('IN_PROGRESS', 'APPROVED', 'REJECTED', 'TIMED_OUT', 'CANCELLED')) not null default 'IN_PROGRESS', "current_step_order" int not null default 0, "current_step_id" uuid null, "requested_by_id" uuid not null, "requested_at" timestamptz not null, "resolved_at" timestamptz null, "description" text null, constraint "approval_requests_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "approval_requests_tenant_id_index" on "approval_requests" ("tenant_id");`,
    );
    this.addSql(
      `create index "approval_requests_workflow_id_index" on "approval_requests" ("workflow_id");`,
    );
    this.addSql(
      `create index "approval_requests_entity_type_index" on "approval_requests" ("entity_type");`,
    );
    this.addSql(
      `create index "approval_requests_entity_id_index" on "approval_requests" ("entity_id");`,
    );

    this.addSql(
      `create table "approval_actions" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "request_id" uuid not null, "step_id" uuid null, "action_type" text check ("action_type" in ('APPROVED', 'REJECTED', 'DELEGATED', 'TIMED_OUT', 'CANCELLED', 'ESCALATED')) not null, "actor_id" uuid null, "delegate_to_id" uuid null, "comment" text null, "occurred_at" timestamptz not null, constraint "approval_actions_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "approval_actions_tenant_id_index" on "approval_actions" ("tenant_id");`,
    );
    this.addSql(
      `create index "approval_actions_request_id_index" on "approval_actions" ("request_id");`,
    );

    this.addSql(
      `alter table "approval_workflows" add constraint "approval_workflows_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "approval_steps" add constraint "approval_steps_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "approval_steps" add constraint "approval_steps_workflow_id_foreign" foreign key ("workflow_id") references "approval_workflows" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "approval_requests" add constraint "approval_requests_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "approval_requests" add constraint "approval_requests_workflow_id_foreign" foreign key ("workflow_id") references "approval_workflows" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "approval_requests" add constraint "approval_requests_current_step_id_foreign" foreign key ("current_step_id") references "approval_steps" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "approval_requests" add constraint "approval_requests_requested_by_id_foreign" foreign key ("requested_by_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "approval_actions" add constraint "approval_actions_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "approval_actions" add constraint "approval_actions_request_id_foreign" foreign key ("request_id") references "approval_requests" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "approval_actions" add constraint "approval_actions_step_id_foreign" foreign key ("step_id") references "approval_steps" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "approval_actions" add constraint "approval_actions_actor_id_foreign" foreign key ("actor_id") references "users" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "approval_actions" add constraint "approval_actions_delegate_to_id_foreign" foreign key ("delegate_to_id") references "users" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "approval_steps" drop constraint "approval_steps_workflow_id_foreign";`,
    );

    this.addSql(
      `alter table "approval_requests" drop constraint "approval_requests_workflow_id_foreign";`,
    );

    this.addSql(
      `alter table "approval_requests" drop constraint "approval_requests_current_step_id_foreign";`,
    );

    this.addSql(
      `alter table "approval_actions" drop constraint "approval_actions_step_id_foreign";`,
    );

    this.addSql(
      `alter table "approval_actions" drop constraint "approval_actions_request_id_foreign";`,
    );

    this.addSql(`drop table if exists "approval_workflows" cascade;`);

    this.addSql(`drop table if exists "approval_steps" cascade;`);

    this.addSql(`drop table if exists "approval_requests" cascade;`);

    this.addSql(`drop table if exists "approval_actions" cascade;`);
  }
}
