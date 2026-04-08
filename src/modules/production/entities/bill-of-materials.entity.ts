import { Entity, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * Reçete (Bill of Materials) — Hammaddeden mamul ürüne dönüşüm tarifi.
 * Ör: 100m kumaş + 50m astar + 10 saat işçilik = 50 adet perde
 */
@Entity({ tableName: 'bill_of_materials' })
export class BillOfMaterials extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string;

  @ManyToOne(() => Product)
  outputProduct!: Product;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  outputQuantity: number = 1;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  laborCostPerUnit: number = 0;

  @Property({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  wastagePercent: number = 0;

  @Property({ nullable: true })
  description?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @OneToMany('BOMComponent', 'bom')
  components = new Collection<any>(this);
}
