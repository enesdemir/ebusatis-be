import { Migration } from '@mikro-orm/migrations';

export class Migration20260412225629_Sprint10PickingPackingOutbound extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "delivery_proofs" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "shipment_id" uuid not null, "signature_base64" text not null, "photo_url" varchar(255) null, "recipient_name" varchar(255) not null, "notes" text null, "captured_at" timestamptz not null, "captured_by_id" uuid null, constraint "delivery_proofs_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "delivery_proofs_tenant_id_index" on "delivery_proofs" ("tenant_id");`,
    );
    this.addSql(
      `create index "delivery_proofs_shipment_id_index" on "delivery_proofs" ("shipment_id");`,
    );
    this.addSql(
      `alter table "delivery_proofs" add constraint "uq_delivery_proof_shipment" unique ("shipment_id");`,
    );

    this.addSql(
      `create table "pickings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "picking_number" varchar(255) not null, "sales_order_id" uuid not null, "status" text check ("status" in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) not null default 'PENDING', "picker_id" uuid null, "started_at" timestamptz null, "completed_at" timestamptz null, "notes" text null, constraint "pickings_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "pickings_tenant_id_index" on "pickings" ("tenant_id");`,
    );
    this.addSql(
      `create index "pickings_picking_number_index" on "pickings" ("picking_number");`,
    );
    this.addSql(
      `create index "pickings_sales_order_id_index" on "pickings" ("sales_order_id");`,
    );

    this.addSql(
      `create table "packings" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "packing_number" varchar(255) not null, "picking_id" uuid not null, "status" text check ("status" in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) not null default 'PENDING', "packer_id" uuid null, "started_at" timestamptz null, "completed_at" timestamptz null, "notes" text null, constraint "packings_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "packings_tenant_id_index" on "packings" ("tenant_id");`,
    );
    this.addSql(
      `create index "packings_packing_number_index" on "packings" ("packing_number");`,
    );
    this.addSql(
      `create index "packings_picking_id_index" on "packings" ("picking_id");`,
    );

    this.addSql(
      `create table "packing_boxes" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "packing_id" uuid not null, "box_number" int not null default 1, "barcode" varchar(255) not null, "weight_kg" numeric(10,3) null, "dimensions_cm" varchar(255) null, constraint "packing_boxes_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "packing_boxes_tenant_id_index" on "packing_boxes" ("tenant_id");`,
    );
    this.addSql(
      `create index "packing_boxes_packing_id_index" on "packing_boxes" ("packing_id");`,
    );
    this.addSql(
      `alter table "packing_boxes" add constraint "uq_packing_box_barcode_per_tenant" unique ("tenant_id", "barcode");`,
    );

    this.addSql(
      `create table "picking_lines" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "tenant_id" uuid not null, "picking_id" uuid not null, "allocation_id" uuid not null, "order_line_id" uuid not null, "scanned_barcode" varchar(255) not null, "picked_quantity" numeric(10,2) not null, "scanned_at" timestamptz not null, "scanned_by_id" uuid null, constraint "picking_lines_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "picking_lines_tenant_id_index" on "picking_lines" ("tenant_id");`,
    );
    this.addSql(
      `create index "picking_lines_picking_id_index" on "picking_lines" ("picking_id");`,
    );
    this.addSql(
      `alter table "picking_lines" add constraint "uq_picking_line_allocation" unique ("picking_id", "allocation_id");`,
    );

    this.addSql(
      `create table "packing_boxes_items" ("packing_box_id" uuid not null, "picking_line_id" uuid not null, constraint "packing_boxes_items_pkey" primary key ("packing_box_id", "picking_line_id"));`,
    );

    this.addSql(
      `alter table "delivery_proofs" add constraint "delivery_proofs_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "delivery_proofs" add constraint "delivery_proofs_shipment_id_foreign" foreign key ("shipment_id") references "shipments" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "delivery_proofs" add constraint "delivery_proofs_captured_by_id_foreign" foreign key ("captured_by_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "pickings" add constraint "pickings_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "pickings" add constraint "pickings_sales_order_id_foreign" foreign key ("sales_order_id") references "sales_orders" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "pickings" add constraint "pickings_picker_id_foreign" foreign key ("picker_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "packings" add constraint "packings_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "packings" add constraint "packings_picking_id_foreign" foreign key ("picking_id") references "pickings" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "packings" add constraint "packings_packer_id_foreign" foreign key ("packer_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "packing_boxes" add constraint "packing_boxes_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "packing_boxes" add constraint "packing_boxes_packing_id_foreign" foreign key ("packing_id") references "packings" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "picking_lines" add constraint "picking_lines_tenant_id_foreign" foreign key ("tenant_id") references "tenants" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "picking_lines" add constraint "picking_lines_picking_id_foreign" foreign key ("picking_id") references "pickings" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "picking_lines" add constraint "picking_lines_allocation_id_foreign" foreign key ("allocation_id") references "order_roll_allocations" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "picking_lines" add constraint "picking_lines_order_line_id_foreign" foreign key ("order_line_id") references "sales_order_lines" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "picking_lines" add constraint "picking_lines_scanned_by_id_foreign" foreign key ("scanned_by_id") references "users" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "packing_boxes_items" add constraint "packing_boxes_items_packing_box_id_foreign" foreign key ("packing_box_id") references "packing_boxes" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "packing_boxes_items" add constraint "packing_boxes_items_picking_line_id_foreign" foreign key ("picking_line_id") references "picking_lines" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "packings" drop constraint "packings_picking_id_foreign";`,
    );

    this.addSql(
      `alter table "picking_lines" drop constraint "picking_lines_picking_id_foreign";`,
    );

    this.addSql(
      `alter table "packing_boxes" drop constraint "packing_boxes_packing_id_foreign";`,
    );

    this.addSql(
      `alter table "packing_boxes_items" drop constraint "packing_boxes_items_packing_box_id_foreign";`,
    );

    this.addSql(
      `alter table "packing_boxes_items" drop constraint "packing_boxes_items_picking_line_id_foreign";`,
    );

    this.addSql(`drop table if exists "delivery_proofs" cascade;`);

    this.addSql(`drop table if exists "pickings" cascade;`);

    this.addSql(`drop table if exists "packings" cascade;`);

    this.addSql(`drop table if exists "packing_boxes" cascade;`);

    this.addSql(`drop table if exists "picking_lines" cascade;`);

    this.addSql(`drop table if exists "packing_boxes_items" cascade;`);
  }
}
