import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';
import { Attribute, AttributeType } from './attribute.entity';

/**
 * Product Attribute Value (EAV)
 *
 * Stores a single attribute value for a product. The column used
 * depends on the attribute type: valueString, valueNumber or
 * valueBoolean.
 *
 * Tenant-scoped via BaseTenantEntity so the @Filter('tenant') applies
 * automatically (stage 4 fix — was previously BaseEntity which meant
 * no tenant isolation on this table).
 */
@Entity({ tableName: 'product_attribute_values' })
export class ProductAttributeValue extends BaseTenantEntity {
  @ManyToOne(() => Product)
  product!: Product;

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
