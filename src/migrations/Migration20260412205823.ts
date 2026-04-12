import { Migration } from '@mikro-orm/migrations';

export class Migration20260412205823 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" add column "tracking_uuid" uuid null, add column "workflow_status" text check ("workflow_status" in ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_SUPPLIER', 'IN_PRODUCTION', 'SHIPPED', 'RECEIVED', 'REVISED', 'CANCELLED', 'CLOSED')) not null default 'DRAFT', add column "revision_number" int not null default 1, add column "revised_from_id" uuid null;`,
    );
    this.addSql(
      `alter table "purchase_orders" add constraint "purchase_orders_revised_from_id_foreign" foreign key ("revised_from_id") references "purchase_orders" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "purchase_orders_tracking_uuid_index" on "purchase_orders" ("tracking_uuid");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" drop constraint "purchase_orders_revised_from_id_foreign";`,
    );

    this.addSql(`drop index "purchase_orders_tracking_uuid_index";`);
    this.addSql(
      `alter table "purchase_orders" drop column "tracking_uuid", drop column "workflow_status", drop column "revision_number", drop column "revised_from_id";`,
    );
  }
}
