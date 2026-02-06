import { Migration } from '@mikro-orm/migrations';

export class Migration20260206151701 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "locale" varchar(255) not null default 'tr';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "locale";`);
  }

}
