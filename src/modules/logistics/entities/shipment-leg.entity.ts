import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Partner } from '../../partners/entities/partner.entity';

/**
 * Type of a single leg on a multi-leg shipment.
 *
 * A real-world international shipment is rarely a single hop; it
 * typically passes through factory pickup, an origin port, sea/air
 * transit, a destination port, customs and one or more transit
 * warehouses before reaching the final destination. Modeling each
 * hop as a `ShipmentLeg` lets us attribute carrier, freight cost,
 * storage cost and ETAs to the right segment.
 */
export enum ShipmentLegType {
  FACTORY_TO_PORT = 'FACTORY_TO_PORT',
  SEA = 'SEA',
  AIR = 'AIR',
  RAIL = 'RAIL',
  PORT_TO_WAREHOUSE = 'PORT_TO_WAREHOUSE',
  WAREHOUSE_TO_WAREHOUSE = 'WAREHOUSE_TO_WAREHOUSE',
  TRANSIT_STORAGE = 'TRANSIT_STORAGE',
  LAST_MILE = 'LAST_MILE',
}

/**
 * Shipment Leg
 *
 * One segment of a multi-leg shipment. Legs are ordered by `legNumber`
 * (1, 2, 3, ...) and roll up into the parent `Shipment` totals
 * (`totalFreightCost`, `totalStorageCost`). The landed-cost calculator
 * sums these values per shipment.
 */
@Entity({ tableName: 'shipment_legs' })
export class ShipmentLeg extends BaseTenantEntity {
  @ManyToOne(() => Shipment)
  @Index()
  shipment!: Shipment;

  /** Sequence number within the parent shipment, starting from 1. */
  @Property()
  legNumber!: number;

  @Enum(() => ShipmentLegType)
  legType!: ShipmentLegType;

  // ── Origin / destination ──

  @Property({ nullable: true })
  originLocation?: string;

  @Property({ nullable: true })
  destinationLocation?: string;

  /** Set when the leg starts or ends at one of our warehouses. */
  @ManyToOne(() => Warehouse, { nullable: true })
  intermediateWarehouse?: Warehouse;

  // ── Dates ──

  @Property({ nullable: true, type: 'datetime' })
  estimatedDeparture?: Date;

  @Property({ nullable: true, type: 'datetime' })
  estimatedArrival?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualDeparture?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualArrival?: Date;

  // ── Carrier and costs ──

  @ManyToOne(() => Partner, { nullable: true })
  carrier?: Partner;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  freightCost: number = 0;

  /**
   * Storage cost incurred while sitting at this leg's intermediate
   * warehouse (e.g. demurrage at port). Zero for transit legs that do
   * not stop at a warehouse.
   */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  storageCost: number = 0;

  /** Catch-all bucket for fees that don't fit elsewhere. */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otherCosts: number = 0;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
