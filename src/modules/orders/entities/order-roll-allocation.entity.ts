import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SalesOrderLine } from './sales-order-line.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';

export enum AllocationStatus {
  RESERVED = 'RESERVED',
  CUT = 'CUT',
  CANCELLED = 'CANCELLED',
}

/**
 * Sipariş-Top Tahsis Kaydı (Order Roll Allocation)
 *
 * Ne işe yarar: Sipariş satırına hangi toptan ne kadar tahsis edildiğini izler.
 * Bir sipariş satırı birden fazla toptan karşılanabilir.
 *
 * Akış:
 * 1. RESERVED: Top seçildi, reservedQuantity arttı, henüz kesilmedi
 * 2. CUT: Kesim yapıldı, InventoryItem.currentQuantity düştü
 * 3. CANCELLED: Tahsis iptal, reservedQuantity geri düştü
 */
@Entity({ tableName: 'order_roll_allocations' })
export class OrderRollAllocation extends BaseTenantEntity {
  @ManyToOne(() => SalesOrderLine)
  orderLine!: SalesOrderLine;

  @ManyToOne(() => InventoryItem)
  roll!: InventoryItem;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  allocatedQuantity!: number; // Bu toptan tahsis edilen miktar

  @Enum(() => AllocationStatus)
  status: AllocationStatus = AllocationStatus.RESERVED;

  @Property({ nullable: true, type: 'datetime' })
  cutAt?: Date; // Kesim yapıldığı zaman
}
