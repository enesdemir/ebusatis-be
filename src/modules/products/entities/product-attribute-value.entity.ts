import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { Attribute, AttributeType } from './attribute.entity';

@Entity({ tableName: 'product_attribute_values' })
export class ProductAttributeValue extends BaseEntity {
  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => Attribute)
  attribute: Attribute;

  @Property({ nullable: true })
  valueString?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueNumber?: number;

  @Property({ nullable: true })
  valueBoolean?: boolean;

  constructor(product: Product, attribute: Attribute) {
    super();
    this.product = product;
    this.attribute = attribute;
  }
  
  // EAV modelinde veriyi doğrudan çekebilmek için helper
  getValue(): string | number | boolean | undefined {
    switch (this.attribute?.type) {
      case AttributeType.STRING: return this.valueString;
      case AttributeType.NUMBER: return this.valueNumber;
      case AttributeType.BOOLEAN: return this.valueBoolean;
      default: return undefined;
    }
  }
}
