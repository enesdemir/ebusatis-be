import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum InventoryItemStatus {
  IN_STOCK = 'IN_STOCK',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  CONSUMED = 'CONSUMED', // Fully used or waste
  LOST = 'LOST',
}

@Entity({ tableName: 'inventory_items' })
export class InventoryItem extends BaseEntity {
  @ManyToOne(() => ProductVariant)
  variant: ProductVariant;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Property({ unique: true })
  barcode: string;

  @Property({ nullable: true })
  batchCode?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  initialQuantity: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  currentQuantity: number;

  @Property({ nullable: true })
  warehouseLocation?: string;

  @Enum(() => InventoryItemStatus)
  status: InventoryItemStatus = InventoryItemStatus.IN_STOCK;

  constructor(variant: ProductVariant, tenant: Tenant, barcode: string, quantity: number) {
    super();
    this.variant = variant;
    this.tenant = tenant;
    this.barcode = barcode;
    this.initialQuantity = quantity;
    this.currentQuantity = quantity;
  }
}
