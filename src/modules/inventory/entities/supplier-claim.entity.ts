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
import { Partner } from '../../partners/entities/partner.entity';
import { GoodsReceive } from './goods-receive.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Type of claim opened against a supplier.
 *
 * Mirrors `DiscrepancyType` on the goods receive line but groups
 * variants of the same business problem (over- vs short-delivery
 * both fall under SHORT_DELIVERY for claim purposes).
 */
export enum ClaimType {
  SHORT_DELIVERY = 'SHORT_DELIVERY',
  DAMAGED = 'DAMAGED',
  WRONG_VARIANT = 'WRONG_VARIANT',
  WRONG_BATCH = 'WRONG_BATCH',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

/**
 * Lifecycle of a supplier claim.
 *
 * Once a claim is settled the financial outcome is captured in
 * `settledAmount`; whether that was a credit note, a replacement
 * shipment or a partial refund is captured in `status`.
 */
export enum ClaimStatus {
  OPEN = 'OPEN',
  NEGOTIATING = 'NEGOTIATING',
  RESOLVED_CREDIT = 'RESOLVED_CREDIT',
  RESOLVED_REPLACEMENT = 'RESOLVED_REPLACEMENT',
  RESOLVED_REFUND = 'RESOLVED_REFUND',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

/**
 * Supplier Claim
 *
 * Opened by the warehouse / purchasing team when a goods receive line
 * has a discrepancy that needs to be billed back to the supplier.
 * Each claim references the originating goods receive and purchase
 * order so the audit trail is intact end-to-end.
 *
 * The detailed per-line breakdown lives in `SupplierClaimLine`.
 */
@Entity({ tableName: 'supplier_claims' })
export class SupplierClaim extends BaseTenantEntity {
  @Property()
  @Index()
  claimNumber!: string; // e.g. "CLM-2026-0001"

  @ManyToOne(() => Partner)
  supplier!: Partner;

  @ManyToOne(() => GoodsReceive)
  @Index()
  goodsReceive!: GoodsReceive;

  @ManyToOne(() => PurchaseOrder)
  @Index()
  purchaseOrder!: PurchaseOrder;

  @Enum(() => ClaimType)
  claimType!: ClaimType;

  @Enum(() => ClaimStatus)
  status: ClaimStatus = ClaimStatus.OPEN;

  // ── Amounts ──

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  claimedAmount!: number;

  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  settledAmount?: number;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  // ── Description and evidence ──

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'jsonb', nullable: true })
  photoUrls?: string[];

  // ── Lifecycle dates ──

  @Property({ type: 'datetime' })
  openedAt: Date = new Date();

  @Property({ nullable: true, type: 'datetime' })
  resolvedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  openedBy?: User;

  // ── Children ──

  @OneToMany('SupplierClaimLine', 'claim')
  lines = new Collection<any>(this);
}
