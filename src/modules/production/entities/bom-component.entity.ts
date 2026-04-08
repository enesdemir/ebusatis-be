import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { BillOfMaterials } from './bill-of-materials.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * BOM Bileşeni — Hammadde kalemi.
 * Her bir girdi malzeme ve miktarı.
 */
@Entity({ tableName: 'bom_components' })
export class BOMComponent extends BaseTenantEntity {
  @ManyToOne(() => BillOfMaterials)
  bom!: BillOfMaterials;

  @ManyToOne(() => Product)
  inputProduct!: Product;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Property({ nullable: true })
  unit?: string;

  @Property({ nullable: true })
  note?: string;

  @Property()
  sortOrder: number = 0;
}
