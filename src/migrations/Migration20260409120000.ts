import { Migration } from '@mikro-orm/migrations';

export class Migration20260409120000 extends Migration {
  override async up(): Promise<void> {
    // Rename old text columns
    this.addSql(
      `alter table "partner_addresses" rename column "country" to "country_name";`,
    );
    this.addSql(
      `alter table "partner_addresses" rename column "city" to "state_name";`,
    );

    // Add new relation columns + cityName
    this.addSql(
      `alter table "partner_addresses" add column "country_id" uuid null;`,
    );
    this.addSql(
      `alter table "partner_addresses" add column "state_id" uuid null;`,
    );
    this.addSql(
      `alter table "partner_addresses" add column "city_id" uuid null;`,
    );
    this.addSql(
      `alter table "partner_addresses" add column "city_name" varchar(255) null;`,
    );

    // Foreign keys
    this.addSql(
      `alter table "partner_addresses" add constraint "partner_addresses_country_id_foreign" foreign key ("country_id") references "classification_nodes" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "partner_addresses" add constraint "partner_addresses_state_id_foreign" foreign key ("state_id") references "classification_nodes" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "partner_addresses" add constraint "partner_addresses_city_id_foreign" foreign key ("city_id") references "classification_nodes" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "partner_addresses" drop constraint if exists "partner_addresses_country_id_foreign";`,
    );
    this.addSql(
      `alter table "partner_addresses" drop constraint if exists "partner_addresses_state_id_foreign";`,
    );
    this.addSql(
      `alter table "partner_addresses" drop constraint if exists "partner_addresses_city_id_foreign";`,
    );

    this.addSql(
      `alter table "partner_addresses" drop column if exists "country_id";`,
    );
    this.addSql(
      `alter table "partner_addresses" drop column if exists "state_id";`,
    );
    this.addSql(
      `alter table "partner_addresses" drop column if exists "city_id";`,
    );
    this.addSql(
      `alter table "partner_addresses" drop column if exists "city_name";`,
    );

    this.addSql(
      `alter table "partner_addresses" rename column "country_name" to "country";`,
    );
    this.addSql(
      `alter table "partner_addresses" rename column "state_name" to "city";`,
    );
  }
}
