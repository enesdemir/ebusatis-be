import { Entity, Property, ManyToOne, OneToMany, Collection, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { PartnerContact } from '../../partners/entities/partner-contact.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

/**
 * Lifecycle of a supplier production order.
 *
 * In the international-import flow, an overseas supplier produces the
 * goods bought via a PurchaseOrder and reports their progress stage by
 * stage. The textile pipeline is:
 *   AWAITING_START → IN_DYEHOUSE → IN_WEAVING → IN_FINISHING →
 *   IN_QC → READY_TO_SHIP → SHIPPED
 */
export enum SupplierProductionStatus {
  AWAITING_START = 'AWAITING_START',
  IN_DYEHOUSE = 'IN_DYEHOUSE',
  IN_WEAVING = 'IN_WEAVING',
  IN_FINISHING = 'IN_FINISHING',
  IN_QC = 'IN_QC',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

/**
 * Supplier Production Order
 *
 * Tracks the production progress of an overseas supplier (a manufacturer
 * factory) for a corresponding PurchaseOrder. This entity is NOT used for
 * in-house production.
 *
 * - Always linked to a PurchaseOrder (1:1 or 1:N — a single PO may be
 *   split into multiple production batches).
 * - The supplier (Partner) is mandatory and represents the producing factory.
 * - Milestones can be reported by the supplier (see ProductionMilestone
 *   `reportedBySupplierAt` and `supplierMediaUrls`).
 * - When the goods leave the factory and enter shipping, the status
 *   transitions to SHIPPED and ownership moves to the Shipment entity.
 */
@Entity({ tableName: 'supplier_production_orders' })
export class SupplierProductionOrder extends BaseTenantEntity {
  @Property()
  @Index()
  productionNumber!: string; // e.g. "SPO-2026-0001"

  // ── Relationships ──

  /**
   * Purchase order this production batch belongs to.
   * A single PO may be split across multiple SupplierProductionOrders.
   */
  @ManyToOne(() => PurchaseOrder)
  @Index()
  purchaseOrder!: PurchaseOrder;

  /** Overseas manufacturer producing the goods. */
  @ManyToOne(() => Partner)
  supplier!: Partner;

  /** Production coordinator on the supplier side. */
  @ManyToOne(() => PartnerContact, { nullable: true })
  supplierContact?: PartnerContact;

  /** Denormalized product reference for single-product orders. */
  @ManyToOne(() => Product, { nullable: true })
  product?: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant?: ProductVariant;

  // ── Quantities ──

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  plannedQuantity!: number;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  producedQuantity: number = 0;

  // ── Status ──

  @Enum(() => SupplierProductionStatus)
  status: SupplierProductionStatus = SupplierProductionStatus.AWAITING_START;

  // ── Dates and location ──

  @Property({ nullable: true })
  factoryLocation?: string; // e.g. "Shanghai, China" / "Hanoi, Vietnam"

  @Property({ nullable: true, type: 'date' })
  estimatedStartDate?: Date;

  @Property({ nullable: true, type: 'date' })
  estimatedCompletionDate?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualStartDate?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualCompletionDate?: Date;

  /** Last time the supplier reported a milestone, photo or note. */
  @Property({ nullable: true, type: 'datetime' })
  lastSupplierUpdateAt?: Date;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  // ── Children ──

  @OneToMany('ProductionMilestone', 'productionOrder')
  milestones = new Collection<any>(this);

  @OneToMany('QualityCheck', 'productionOrder')
  qualityChecks = new Collection<any>(this);

  @OneToMany('ProductionMedia', 'productionOrder')
  media = new Collection<any>(this);
}
