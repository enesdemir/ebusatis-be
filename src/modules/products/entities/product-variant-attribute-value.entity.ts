import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductVariant } from './product-variant.entity';
import { Attribute, AttributeType } from './attribute.entity';

/**
 * Product Variant Attribute Value (EAV)
 *
 * Stores a single attribute value for a product variant.
 *
 * Tenant-scoped via BaseTenantEntity (stage 4 fix — was previously
 * BaseEntity with no tenant isolation).
 */
@Entity({ tableName: 'product_variant_attribute_values' })
export class ProductVariantAttributeValue extends BaseTenantEntity {
  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @ManyToOne(() => Attribute)
  attribute!: Attribute;

  @Property({ nullable: true })
  valueString?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valueNumber?: number;

  @Property({ nullable: true })
  valueBoolean?: boolean;

  /** Helper to read the typed value from the correct column. */
  getValue(): string | number | boolean | undefined {
    switch (this.attribute?.type) {
      case AttributeType.STRING:
        return this.valueString;
      case AttributeType.NUMBER:
        return this.valueNumber;
      case AttributeType.BOOLEAN:
        return this.valueBoolean;
      default:
        return undefined;
    }
  }
}
