import { Migration } from '@mikro-orm/migrations';

export class Migration20260412204425 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" add column "actual_delivery_date" date null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "purchase_orders" drop column "actual_delivery_date";`,
    );
  }
}
