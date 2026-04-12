import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Counterparty } from '../../partners/entities/counterparty.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { StatusDefinition } from '../../definitions/entities/status-definition.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Purchase Order
 *
 * The supplier-facing order placed by us. In the international-import
 * flow this entity is the entry point: it spawns a SupplierProductionOrder
 * (production tracking), eventually a Shipment (transit) and a
 * GoodsReceive (warehouse arrival), and feeds into a LandedCostCalculation
 * once the shipment lands.
 */
@Entity({ tableName: 'purchase_orders' })
export class PurchaseOrder extends BaseTenantEntity {
  @Property()
  @Index()
  orderNumber!: string; // e.g. "PO-2026-0001"

  @ManyToOne(() => Partner)
  supplier!: Partner;

  @ManyToOne(() => Counterparty, { nullable: true })
  counterparty?: Counterparty;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: number;

  @ManyToOne(() => StatusDefinition, { nullable: true })
  status?: StatusDefinition;

  @Property({ nullable: true, type: 'date' })
  expectedDeliveryDate?: Date;

  /** Actual delivery date, set automatically when a linked GR is created. */
  @Property({ nullable: true, type: 'date' })
  actualDeliveryDate?: Date;

  // ─── Amounts ─────────────────────────────────────────────

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  grandTotal: number = 0;

  // ─── Payment terms (stage 0.C) ────────────────────────────

  /** Deposit prepaid to the supplier when the order is placed. */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  downPaymentAmount: number = 0;

  /**
   * Free-text payment terms negotiated with the supplier.
   * Example: "30% deposit, 70% on bill of lading", "Net 30".
   */
  @Property({ nullable: true, type: 'text' })
  paymentTerms?: string;

  // ─── Notification scheduling (stage 0.C) ──────────────────

  /**
   * Delivery warning configuration consumed by the scheduled
   * notification engine. Each entry defines how many days before
   * `expectedDeliveryDate` an alert should fire and which user groups
   * should receive it. Example payload:
   *   [
   *     { daysBefore: 14, recipientGroupCodes: ['logistics_team'] },
   *     { daysBefore: 7,  recipientGroupCodes: ['logistics_team', 'finance_team'] }
   *   ]
   */
  @Property({ type: 'jsonb', nullable: true })
  deliveryWarningConfig?: Array<{
    daysBefore: number;
    recipientGroupCodes?: string[];
    recipientUserIds?: string[];
  }>;

  // ─── Document attachments (stage 0.C) ─────────────────────

  /** QR code payload printed on the PO PDF; populated by the PDF service. */
  @Property({ nullable: true, type: 'text' })
  qrCode?: string;

  /** URL of the digitally signed PO PDF. */
  @Property({ nullable: true })
  digitalSignatureUrl?: string;

  // ─── Import / container metadata ──────────────────────────
  //
  // Light-weight container info kept for backwards compatibility. The
  // detailed multi-leg information lives on the Shipment / ShipmentLeg
  // entities introduced in stage 0.B / 0.C.

  @Property({ type: 'json', nullable: true })
  containerInfo?: {
    containerNo?: string;
    vessel?: string;
    customsRef?: string;
  };

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('PurchaseOrderLine', 'order')
  lines = new Collection<object>(this);
}
