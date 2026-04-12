import { Migration } from '@mikro-orm/migrations';

export class Migration20260412210707 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "documents" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "category" text check ("category" in ('SYSTEM_GENERATED', 'USER_UPLOADED')) not null default 'USER_UPLOADED', "document_type" text check ("document_type" in ('PO_CONTRACT', 'SALES_ORDER_CONFIRMATION', 'INVOICE', 'PAYMENT_RECEIPT', 'SHIPMENT_DOC', 'CLAIM_REPORT', 'KARTELA_LABEL', 'CUSTOMER_TRANSFER', 'SUPPLIER_INVOICE', 'BILL_OF_LADING', 'CUSTOMS_DECLARATION', 'PACKING_LIST', 'QC_REPORT', 'QC_PHOTO', 'BANK_RECEIPT', 'CONTRACT', 'CERTIFICATE', 'OTHER')) not null, "entity_type" varchar(255) not null, "entity_id" varchar(255) not null, "file_name" varchar(255) not null, "mime_type" varchar(255) not null, "file_size" int not null, "storage_key" varchar(255) not null, "version" int not null default 1, "replaced_by_id" uuid null, "description" text null, "tags" jsonb null, "uploaded_by_id" uuid null, "uploaded_at" timestamptz not null, constraint "documents_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "documents_tenant_id_index" on "documents" ("tenant_id");`,
    );
    this.addSql(
      `create index "documents_document_type_index" on "documents" ("document_type");`,
    );
    this.addSql(
      `create index "documents_entity_type_index" on "documents" ("entity_type");`,
    );
    this.addSql(
      `create index "documents_entity_id_index" on "documents" ("entity_id");`,
    );

    this.addSql(
      `alter table "documents" add constraint "documents_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "documents" add constraint "documents_replaced_by_id_foreign" foreign key ("replaced_by_id") references "documents" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "documents" add constraint "documents_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "users" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "documents" drop constraint "documents_replaced_by_id_foreign";`,
    );

    this.addSql(`drop table if exists "documents" cascade;`);
  }
}
