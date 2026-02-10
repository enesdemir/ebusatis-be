import { Migration } from '@mikro-orm/migrations';

export class Migration20260207161707 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "permissions" add column "assignable_scope" varchar(255) not null default 'TENANT';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "permissions" drop column "assignable_scope";`);
  }

}
