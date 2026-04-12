import { Migration } from '@mikro-orm/migrations';

export class Migration20260412201101 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "platform_configs" drop constraint if exists "platform_configs_category_check";`,
    );

    this.addSql(
      `alter table "platform_configs" add constraint "platform_configs_category_check" check("category" in ('GENERAL', 'SECURITY', 'NOTIFICATIONS', 'BILLING', 'INVENTORY', 'STORAGE', 'EMAIL', 'DOCUMENT'));`,
    );

    this.addSql(
      `alter table "sales_orders" add column "order_type" text check ("order_type" in ('FABRIC', 'PRODUCT')) not null default 'FABRIC', add column "payment_type" text check ("payment_type" in ('CASH', 'CREDIT', 'PARTIAL')) not null default 'CASH', add column "partial_payment_rate" numeric(5,2) null, add column "workflow_status" text check ("workflow_status" in ('DRAFT', 'PENDING_PAYMENT', 'PENDING_CREDIT_APPROVAL', 'BLOCKED_AWAITING_MATERIAL', 'APPROVED', 'ALLOCATED', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED', 'CANCELLED')) not null default 'DRAFT';`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "platform_configs" drop constraint if exists "platform_configs_category_check";`,
    );

    this.addSql(
      `alter table "platform_configs" add constraint "platform_configs_category_check" check("category" in ('GENERAL', 'SECURITY', 'NOTIFICATIONS', 'BILLING'));`,
    );

    this.addSql(
      `alter table "sales_orders" drop column "order_type", drop column "payment_type", drop column "partial_payment_rate", drop column "workflow_status";`,
    );
  }
}
