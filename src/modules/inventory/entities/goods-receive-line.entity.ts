import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { GoodsReceive } from './goods-receive.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { SupplierClaim } from './supplier-claim.entity';

/**
 * Type of discrepancy detected on a single goods receive line.
 *
 * Captured during goods receive when the warehouse team finds a
 * mismatch between the expected and actual delivery. The discrepancy
 * type drives the UI workflow (claim vs short-deliver vs replace) and
 * the supplier-claim that may be opened from it.
 */
export enum DiscrepancyType {
  NONE = 'NONE',
  QUANTITY_SHORT = 'QUANTITY_SHORT',
  QUANTITY_OVER = 'QUANTITY_OVER',
  DAMAGED = 'DAMAGED',
  WRONG_VARIANT = 'WRONG_VARIANT',
  WRONG_BATCH = 'WRONG_BATCH',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

/**
 * Goods Receive Line
 *
 * One row per variant in a goods receive: how many rolls were planned,
 * how many actually arrived and (stage 0.C) any discrepancy that the
 * warehouse team flagged on inspection. When a discrepancy is set the
 * UI offers to open a SupplierClaim that links back via the `claim`
 * foreign key.
 */
@Entity({ tableName: 'goods_receive_lines' })
export class GoodsReceiveLine extends BaseTenantEntity {
  @ManyToOne(() => GoodsReceive)
  @Index()
  goodsReceive!: GoodsReceive;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  /** Quantity expected from the related PO line, when known. */
  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedQuantity?: number;

  @Property({ default: 0 })
  receivedRollCount: number = 0;

  /** Total received metres / pieces / kg for this variant. */
  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalReceivedQuantity: number = 0;

  // ── Discrepancy tracking (stage 0.C) ──

  @Enum(() => DiscrepancyType)
  discrepancyType: DiscrepancyType = DiscrepancyType.NONE;

  /** Quantity affected by the discrepancy (e.g. missing or damaged units). */
  @Property({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discrepancyQuantity?: number;

  /** Free-text explanation captured by the warehouse user. */
  @Property({ nullable: true, type: 'text' })
  discrepancyReason?: string;

  /** Notes about the physical condition of the goods. */
  @Property({ nullable: true, type: 'text' })
  conditionNotes?: string;

  /** URLs of photos uploaded as evidence (damaged rolls, wrong labels). */
  @Property({ type: 'jsonb', nullable: true })
  photoEvidenceUrls?: string[];

  /** Supplier claim opened against this line, if any. */
  @ManyToOne(() => SupplierClaim, { nullable: true })
  @Index()
  claim?: SupplierClaim;

  // ── Misc ──

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
