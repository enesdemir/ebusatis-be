import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { DeliveryMethod } from '../../definitions/entities/delivery-method.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Direction of a shipment.
 *
 * - INBOUND: goods arriving at our warehouses (typically the
 *   international-import flow from a supplier factory).
 * - OUTBOUND: goods leaving our warehouses to a customer.
 *
 * Stage 0.B unified the previously separate `logistics/shipment_plans`
 * (inbound) and `finance/shipments` (outbound) entities under this
 * single `Shipment` table; the `direction` enum is the discriminator.
 */
export enum ShipmentDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

/**
 * Shipment lifecycle status.
 *
 * The status set is shared across both directions but not every status
 * is meaningful for both. For example AT_CUSTOMS only makes sense for
 * INBOUND shipments crossing a border.
 */
export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_CUSTOMS = 'AT_CUSTOMS',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

/**
 * Incoterms 2020 — international commercial trade terms.
 *
 * Captured at the shipment level so cost ownership boundaries are
 * explicit between buyer and seller. Used by the landed-cost calculator
 * to decide which legs of freight, insurance and customs costs the
 * buyer is responsible for.
 */
export enum Incoterm {
  EXW = 'EXW',
  FCA = 'FCA',
  CPT = 'CPT',
  CIP = 'CIP',
  DAP = 'DAP',
  DPU = 'DPU',
  DDP = 'DDP',
  FAS = 'FAS',
  FOB = 'FOB',
  CFR = 'CFR',
  CIF = 'CIF',
}

/**
 * Shipment
 *
 * Unified shipment record covering both directions. Vehicle, driver,
 * container, vessel and customs metadata live here so that they don't
 * need to be duplicated between INBOUND and OUTBOUND models.
 *
 * Either `purchaseOrder` (INBOUND) or `salesOrder` (OUTBOUND) is set
 * depending on the direction. The XOR is enforced at the service layer
 * (DTO validation) rather than via a database constraint to keep the
 * schema flexible for future shipment types (e.g. transfer between
 * warehouses).
 */
@Entity({ tableName: 'shipments' })
export class Shipment extends BaseTenantEntity {
  @Property()
  @Index()
  shipmentNumber!: string; // e.g. "SH-2026-0001"

  @Enum(() => ShipmentDirection)
  @Index()
  direction!: ShipmentDirection;

  @Enum(() => ShipmentStatus)
  status: ShipmentStatus = ShipmentStatus.DRAFT;

  // ── Order linkage (XOR by direction) ──

  /** Set when direction = INBOUND. */
  @ManyToOne(() => PurchaseOrder, { nullable: true })
  purchaseOrder?: PurchaseOrder;

  /** Set when direction = OUTBOUND. */
  @ManyToOne(() => SalesOrder, { nullable: true })
  salesOrder?: SalesOrder;

  // ── Origin / destination ──
  //
  // For internal-to-internal moves, the warehouse references are used.
  // For external addresses (supplier factory, customer site), the
  // free-text fields below are used. The two are not mutually exclusive
  // since a multi-leg shipment may start at a supplier factory and end
  // at our warehouse.

  @ManyToOne(() => Warehouse, { nullable: true })
  originWarehouse?: Warehouse;

  @ManyToOne(() => Warehouse, { nullable: true })
  destinationWarehouse?: Warehouse;

  @Property({ nullable: true })
  originAddress?: string;

  @Property({ nullable: true })
  destinationAddress?: string;

  // ── Carrier and tracking ──

  @ManyToOne(() => Partner, { nullable: true })
  carrier?: Partner;

  @ManyToOne(() => DeliveryMethod, { nullable: true })
  deliveryMethod?: DeliveryMethod;

  @Property({ nullable: true })
  carrierTrackingNumber?: string;

  @Property({ nullable: true })
  carrierTrackingUrl?: string;

  // ── Container / vessel (mostly INBOUND) ──

  @Property({ nullable: true })
  containerNumber?: string;

  @Property({ nullable: true })
  containerType?: string;

  @Property({ nullable: true })
  sealNumber?: string;

  @Property({ nullable: true })
  vessel?: string;

  @Property({ nullable: true })
  voyageNumber?: string;

  @Enum({ items: () => Incoterm, nullable: true })
  incoterm?: Incoterm;

  // ── Vehicle / driver ──
  //
  // Captured at goods receive (INBOUND) or pickup (OUTBOUND). Required
  // by the goods-receive flow described in the international-import
  // master diagram.

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

  // ── Dates ──

  @Property({ nullable: true, type: 'date' })
  estimatedDeparture?: Date;

  @Property({ nullable: true, type: 'date' })
  estimatedArrival?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualDeparture?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualArrival?: Date;

  // ── Cost summary ──
  //
  // These are denormalized totals for convenience. The detailed
  // breakdown lives on related entities (FreightQuote, ContainerEvent,
  // CustomsDeclaration and the upcoming ShipmentLeg / LandedCost
  // entities in stage 0.C).

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalFreightCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCustomsCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalStorageCost: number = 0;

  @ManyToOne(() => Currency, { nullable: true })
  costCurrency?: Currency;

  // ── Misc ──

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  // ── Relationships ──

  @OneToMany('ShipmentLine', 'shipment')
  lines = new Collection<any>(this);

  @OneToMany('ContainerEvent', 'shipment')
  events = new Collection<any>(this);

  @OneToMany('FreightQuote', 'shipment')
  freightQuotes = new Collection<any>(this);

  @OneToMany('CustomsDeclaration', 'shipment')
  customsDeclarations = new Collection<any>(this);
}
