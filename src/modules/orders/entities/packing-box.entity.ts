import {
  Entity,
  Property,
  ManyToOne,
  ManyToMany,
  Collection,
  Index,
  Unique,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Packing } from './packing.entity';
import { PickingLine } from './picking-line.entity';

/**
 * PackingBox — physical shipping carton.
 *
 * Barcode is tenant-scoped unique so box labels printed in warehouse A
 * never clash with warehouse B. Weight/dimensions are captured for the
 * shipping label + carrier API payload.
 */
@Entity({ tableName: 'packing_boxes' })
@Unique({
  properties: ['tenant', 'barcode'],
  name: 'uq_packing_box_barcode_per_tenant',
})
export class PackingBox extends BaseTenantEntity {
  @ManyToOne(() => Packing)
  @Index()
  packing!: Packing;

  @Property({ default: 1 })
  boxNumber: number = 1;

  @Property()
  barcode!: string;

  @Property({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weightKg?: number;

  @Property({ nullable: true })
  dimensionsCm?: string; // "40x30x20"

  @ManyToMany(() => PickingLine, undefined, { owner: true })
  items = new Collection<PickingLine>(this);
}
