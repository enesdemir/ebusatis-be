import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { BillOfMaterials } from './bill-of-materials.entity';
import { ProductVariant } from './product-variant.entity';
import { UnitOfMeasure } from '../../definitions/entities/unit-of-measure.entity';

/**
 * Single component line within a Bill of Materials.
 *
 * Each row links the parent BOM to one component variant, with the
 * quantity consumed per BOM execution and the unit (metre, piece, etc.).
 * `isRequired` allows optional accessories (e.g., decorative tag) to be
 * skipped when not in stock.
 */
@Entity({ tableName: 'bom_components' })
export class BomComponent extends BaseTenantEntity {
  @ManyToOne(() => BillOfMaterials)
  bom!: BillOfMaterials;

  /** The child variant used as a component (e.g., fabric, button, tag). */
  @ManyToOne(() => ProductVariant)
  componentVariant!: ProductVariant;

  /** Quantity consumed per BOM execution (in `unit`). */
  @Property({ type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  unit?: UnitOfMeasure;

  /** When false, stock shortage on this component is non-blocking. */
  @Property({ default: true })
  isRequired: boolean = true;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
