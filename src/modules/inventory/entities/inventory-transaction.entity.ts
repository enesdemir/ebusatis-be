import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryItem } from './inventory-item.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  PURCHASE = 'PURCHASE',       // Giriş
  SALE_CUT = 'SALE_CUT',       // Satış Kesimi
  WASTE = 'WASTE',             // Fire
  ADJUSTMENT = 'ADJUSTMENT',   // Sayım Farkı
  RETURN = 'RETURN',           // İade
}

@Entity({ tableName: 'inventory_transactions' })
export class InventoryTransaction extends BaseEntity {
  @ManyToOne(() => InventoryItem)
  item: InventoryItem;

  @Enum(() => TransactionType)
  type: TransactionType;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantityChange: number; // Negative for cuts, Positive for adjustment/return

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  previousQuantity: number;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  newQuantity: number;

  @Property({ nullable: true })
  referenceId?: string; // Order ID, etc.

  @Property({ nullable: true })
  note?: string;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  constructor(item: InventoryItem, type: TransactionType, quantityChange: number, previous: number, checkUser?: User) {
    super();
    this.item = item;
    this.type = type;
    this.quantityChange = quantityChange;
    this.previousQuantity = previous;
    this.newQuantity = previous + quantityChange;
    this.createdBy = checkUser;
  }
}
