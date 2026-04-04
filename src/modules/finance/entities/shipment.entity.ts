import { Entity, Property, Enum, ManyToOne, OneToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { DeliveryMethod } from '../../definitions/entities/delivery-method.entity';
import { User } from '../../users/entities/user.entity';

export enum ShipmentStatus {
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

/**
 * İrsaliye / Sevkiyat (Shipment)
 *
 * Ne işe yarar: Siparişin fiziksel sevki. Hangi toplar hangi siparişe sevk edildi.
 * Nerede kullanılır: Sevkiyat listesi, kargo takip, sipariş detayında "Sevkiyat" tab'ı
 */
@Entity({ tableName: 'shipments' })
export class Shipment extends BaseTenantEntity {
  @Property()
  @Index()
  shipmentNumber!: string; // "SH-2026-0001"

  @ManyToOne(() => SalesOrder)
  salesOrder!: SalesOrder;

  @ManyToOne(() => Warehouse, { nullable: true })
  warehouse?: Warehouse;

  @ManyToOne(() => DeliveryMethod, { nullable: true })
  deliveryMethod?: DeliveryMethod;

  @Enum(() => ShipmentStatus)
  status: ShipmentStatus = ShipmentStatus.PREPARING;

  @Property({ nullable: true })
  trackingNumber?: string;

  @Property({ nullable: true, type: 'datetime' })
  shippedAt?: Date;

  @Property({ nullable: true, type: 'datetime' })
  deliveredAt?: Date;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('ShipmentLine', 'shipment')
  lines = new Collection<any>(this);
}
