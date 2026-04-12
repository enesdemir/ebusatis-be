import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SupplierClaim } from './supplier-claim.entity';
import { GoodsReceiveLine } from './goods-receive-line.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

/**
 * Supplier Claim Line
 *
 * One row per affected variant in a supplier claim. Each line keeps a
 * pointer back to the originating goods receive line so the warehouse
 * team can reconcile the claim against the physical inspection.
 */
@Entity({ tableName: 'supplier_claim_lines' })
export class SupplierClaimLine extends BaseTenantEntity {
  @ManyToOne(() => SupplierClaim)
  @Index()
  claim!: SupplierClaim;

  /** Goods receive line this claim line was raised from. */
  @ManyToOne(() => GoodsReceiveLine, { nullable: true })
  @Index()
  goodsReceiveLine?: GoodsReceiveLine;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  affectedQuantity!: number;

  /** Per-unit price used to compute the claim amount. */
  @Property({ type: 'decimal', precision: 14, scale: 4 })
  unitPrice!: number;

  /** affectedQuantity * unitPrice — denormalized for fast aggregation. */
  @Property({ type: 'decimal', precision: 14, scale: 2 })
  lineTotal!: number;

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
