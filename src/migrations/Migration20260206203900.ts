import { Migration } from '@mikro-orm/migrations';

export class Migration20260206203900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "tenants" add column "features" jsonb not null default '{"stock": true, "b2b": false, "production": false, "invoice": false}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "tenants" drop column "features";`);
  }

}
