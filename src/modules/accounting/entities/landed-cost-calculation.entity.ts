import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Per-line allocation snapshot stored on a landed cost calculation.
 *
 * Each entry records how many units of which line received what
 * allocation of each cost bucket and what the resulting per-unit
 * landed cost is. The same numbers are also written back to the
 * `purchase_order_lines.landed_unit_cost` column for fast access by
 * downstream consumers (inventory valuation, margin reports, ...).
 */
export interface LandedCostLineAllocation {
  lineId: string;
  variantId: string;
  quantity: number;
  productCost: number;
  allocatedFreight: number;
  allocatedCustomsDuty: number;
  allocatedCustomsVat: number;
  allocatedBrokerFee: number;
  allocatedInsurance: number;
  allocatedStorage: number;
  allocatedOther: number;
  totalAllocated: number;
  landedUnitCost: number;
}

/**
 * Landed Cost Calculation
 *
 * Aggregates every cost component related to a single PurchaseOrder
 * (and its associated Shipment when available) and produces a per-line
 * landed unit cost. This is the central artifact that powers margin
 * reporting and inventory valuation in the international-import flow.
 *
 * Cost components captured:
 *   - productCost          — purchase price (PO grand total)
 *   - freightCost          — sum of ShipmentLeg freight
 *   - customsDuty          — sum of CustomsDeclaration duties
 *   - customsVat           — sum of CustomsDeclaration VAT
 *   - brokerFee            — sum of CustomsDeclaration broker fees
 *   - insuranceCost        — sum of CustomsDeclaration insurance
 *   - storageCost          — sum of ShipmentLeg storage costs
 *   - inlandTransportCost  — last-mile and warehouse-to-warehouse legs
 *   - otherCosts           — catch-all bucket
 *
 * `lineAllocations` snapshots the per-line breakdown so the calculation
 * is auditable after the fact even if the underlying PO lines change.
 */
@Entity({ tableName: 'landed_cost_calculations' })
export class LandedCostCalculation extends BaseTenantEntity {
  @ManyToOne(() => PurchaseOrder)
  @Index()
  purchaseOrder!: PurchaseOrder;

  @ManyToOne(() => Shipment, { nullable: true })
  @Index()
  shipment?: Shipment;

  // ── Cost components ──

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  productCost!: number;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  freightCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customsDuty: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customsVat: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  brokerFee: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  insuranceCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  storageCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  inlandTransportCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otherCosts: number = 0;

  /** Sum of every component above. */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  totalLandedCost!: number;

  // ── Reporting metadata ──

  @ManyToOne(() => Currency)
  currency!: Currency;

  @Property({ type: 'datetime' })
  calculatedAt: Date = new Date();

  @ManyToOne(() => User, { nullable: true })
  calculatedBy?: User;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  /**
   * Frozen per-line allocation breakdown. Stored as a JSON snapshot so
   * the calculation remains auditable even if the underlying PO lines
   * are edited later.
   */
  @Property({ type: 'jsonb', nullable: true })
  lineAllocations?: LandedCostLineAllocation[];
}
