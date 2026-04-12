import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Unique,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductVariant } from './product-variant.entity';
import { BomComponent } from './bom-component.entity';

/**
 * Bill of Materials (BOM)
 *
 * Defines the component structure of a PRODUCT-type variant.
 * Used by SalesOrder to verify that all required accessories are in stock
 * before the order can progress past PENDING approvals.
 *
 * One BOM per product variant (1:1 enforced by unique constraint on the
 * `variant` column per tenant). `yield` captures how many finished items
 * one execution of the BOM produces (e.g., 1 finished curtain per BOM run).
 */
@Entity({ tableName: 'bills_of_materials' })
@Unique({ properties: ['tenant', 'variant'] })
export class BillOfMaterials extends BaseTenantEntity {
  /** Target finished product variant that this BOM assembles. */
  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property()
  name!: string;

  /** Number of finished units one BOM execution produces (default 1). */
  @Property({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  yield: number = 1;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @OneToMany(() => BomComponent, (c) => c.bom)
  components = new Collection<BomComponent>(this);
}
