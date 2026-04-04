import { Entity, Property, Enum, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';

export enum GoodsReceiveStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Mal Kabul Fişi (Goods Receive)
 *
 * Ne işe yarar: Tedarikçiden gelen malın sisteme kaydı. Her mal kabul birden fazla topu içerir.
 * Nerede kullanılır: WMS > Mal Kabul, PurchaseOrder ile bağlantı (ileride)
 *
 * Akış: Tedarikçi seç → Ürün/varyant seç → Topları gir (barkod, metraj, lot) → Tamamla
 * Tamamlandığında: InventoryItem'lar oluşur, InventoryTransaction(PURCHASE) kaydedilir
 */
@Entity({ tableName: 'goods_receives' })
export class GoodsReceive extends BaseTenantEntity {
  @Property()
  receiveNumber!: string; // "GR-2026-0001"

  @ManyToOne(() => Partner)
  supplier!: Partner;

  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  @Property({ nullable: true })
  purchaseOrderId?: string; // PurchaseOrder FK (Kademe 5'te)

  @Property({ type: 'datetime' })
  receivedAt: Date = new Date();

  @Enum(() => GoodsReceiveStatus)
  status: GoodsReceiveStatus = GoodsReceiveStatus.DRAFT;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('GoodsReceiveLine', 'goodsReceive')
  lines = new Collection<any>(this);
}
