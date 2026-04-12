import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { InventoryItem } from './inventory-item.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE_CUT = 'SALE_CUT',
  WASTE = 'WASTE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

/**
 * Inventory Transaction
 *
 * Immutable ledger entry for every quantity change on a roll. Each
 * row captures the before/after quantity and the delta so the full
 * history is auditable.
 *
 * Tenant-scoped via BaseTenantEntity (stage 4 fix — was previously
 * BaseEntity with no tenant isolation).
 */
@Entity({ tableName: 'inventory_transactions' })
export class InventoryTransaction extends BaseTenantEntity {
  @ManyToOne(() => InventoryItem)
  item!: InventoryItem;

  @Enum(() => TransactionType)
  type!: TransactionType;

  /** Negative for cuts/waste, positive for purchase/adjustment/return. */
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantityChange!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  previousQuantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  newQuantity!: number;

  /** External reference (order ID, goods receive ID, etc.). */
  @Property({ nullable: true })
  referenceId?: string;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;
}
