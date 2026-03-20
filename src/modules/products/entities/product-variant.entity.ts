import { Entity, Property, ManyToOne, Collection, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductVariantAttributeValue } from './product-variant-attribute-value.entity';

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

  // EAV - Varyanta Özel Dinamik Özellikler (En, Boy, Çap, Kalite vb.)
  @OneToMany(() => ProductVariantAttributeValue, attrValue => attrValue.variant)
  attributeValues = new Collection<ProductVariantAttributeValue>(this);

  constructor(name: string, sku: string, product: Product) {
    super();
    this.name = name;
    this.sku = sku;
    this.product = product;
    this.price = 0;
  }
}
