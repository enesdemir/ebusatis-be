import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';

export enum GoodsReceiveStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Goods Receive
 *
 * Records the physical arrival of goods at one of our warehouses. Each
 * goods receive is the warehouse-side counterpart of a `PurchaseOrder`
 * and a `Shipment`. Stage 0.C added vehicle / driver / responsible-user
 * fields so the international-import flow can capture the truck
 * details required by the master diagram.
 *
 * Flow: pick supplier → pick variant → register rolls (barcode, length,
 * lot) → mark complete. On completion the service creates the
 * `InventoryItem` rows and a `PURCHASE` inventory transaction.
 */
@Entity({ tableName: 'goods_receives' })
export class GoodsReceive extends BaseTenantEntity {
  @Property()
  @Index()
  receiveNumber!: string; // e.g. "GR-2026-0001"

  @ManyToOne(() => Partner)
  supplier!: Partner;

  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  /**
   * Linked purchase order. Replaces the previous loose `purchaseOrderId:
   * string` placeholder with a real foreign key now that the import
   * flow needs the link to be queryable in joins.
   */
  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @Index()
  purchaseOrder?: PurchaseOrder;

  /** Optional shipment that physically delivered the goods. */
  @ManyToOne(() => Shipment, { nullable: true })
  @Index()
  shipment?: Shipment;

  // ── Vehicle / driver (stage 0.C) ──

  @Property({ nullable: true })
  vehiclePlate?: string;

  @Property({ nullable: true })
  vehicleType?: string;

  @Property({ nullable: true })
  driverName?: string;

  @Property({ nullable: true })
  driverPhone?: string;

  @Property({ nullable: true })
  driverIdNumber?: string;

  /** Estimated arrival time, captured at planning time. */
  @Property({ nullable: true, type: 'datetime' })
  eta?: Date;

  /** Internal user who actually accepted the delivery at the warehouse. */
  @ManyToOne(() => User, { nullable: true })
  receivedBy?: User;

  /** Internal user coordinating the shipment with the carrier / supplier. */
  @ManyToOne(() => User, { nullable: true })
  shipmentResponsible?: User;

  // ── Lifecycle ──

  @Property({ type: 'datetime' })
  receivedAt: Date = new Date();

  @Enum(() => GoodsReceiveStatus)
  status: GoodsReceiveStatus = GoodsReceiveStatus.DRAFT;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('GoodsReceiveLine', 'goodsReceive')
  lines = new Collection<object>(this);
}
