import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { InventoryCount } from './inventory-count.entity';
import { InventoryItem } from './inventory-item.entity';

/**
 * Inventory Count Line
 *
 * One row per item counted during a stock-taking session. The variance
 * (`actualQuantity - expectedQuantity`) drives the reconciliation
 * adjustment: positive = surplus, negative = shortage.
 */
@Entity({ tableName: 'inventory_count_lines' })
export class InventoryCountLine extends BaseTenantEntity {
  @ManyToOne(() => InventoryCount)
  @Index()
  count!: InventoryCount;

  @ManyToOne(() => InventoryItem)
  item!: InventoryItem;

  /** System-reported quantity at the time the count was opened. */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  expectedQuantity!: number;

  /** Warehouse team's physical count. */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  actualQuantity!: number;

  /** `actualQuantity - expectedQuantity` — positive = surplus, negative = shortage. */
  @Property({ type: 'decimal', precision: 12, scale: 2 })
  variance!: number;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
