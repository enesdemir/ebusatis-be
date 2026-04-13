import { Migration } from '@mikro-orm/migrations';

export class Migration20260413044844_AuditFixes extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" add constraint "uq_purchase_order_number_per_tenant" unique ("tenant_id", "order_number");`,
    );

    this.addSql(
      `alter table "sales_orders" add constraint "uq_sales_order_number_per_tenant" unique ("tenant_id", "order_number");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" drop constraint "uq_purchase_order_number_per_tenant";`,
    );

    this.addSql(
      `alter table "sales_orders" drop constraint "uq_sales_order_number_per_tenant";`,
    );
  }
}
