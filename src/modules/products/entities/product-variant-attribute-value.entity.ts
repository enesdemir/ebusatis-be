import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductVariant } from './product-variant.entity';
import { Attribute, AttributeType } from './attribute.entity';

@Entity({ tableName: 'product_variant_attribute_values' })
export class ProductVariantAttributeValue extends BaseEntity {
  @ManyToOne(() => ProductVariant)
  variant: ProductVariant;

  @ManyToOne(() => Attribute)
  attribute: Attribute;

  @Property({ nullable: true })
  valueString?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueNumber?: number;

  @Property({ nullable: true })
  valueBoolean?: boolean;

  constructor(variant: ProductVariant, attribute: Attribute) {
    super();
    this.variant = variant;
    this.attribute = attribute;
  }
  
  // Veriyi okumayı inanılmaz kolaylaştıran helper
  getValue(): string | number | boolean | undefined {
    switch (this.attribute?.type) {
      case AttributeType.STRING: return this.valueString;
      case AttributeType.NUMBER: return this.valueNumber;
      case AttributeType.BOOLEAN: return this.valueBoolean;
      default: return undefined;
    }
  }
}
