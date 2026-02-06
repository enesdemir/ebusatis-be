import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

@Entity({ tableName: 'product_variants' })
export class ProductVariant extends BaseEntity {
  @Property()
  name: string;

  @Property({ unique: true })
  sku: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @ManyToOne(() => Product)
  product: Product;

  constructor(name: string, sku: string, product: Product) {
    super();
    this.name = name;
    this.sku = sku;
    this.product = product;
    this.price = 0;
  }
}
