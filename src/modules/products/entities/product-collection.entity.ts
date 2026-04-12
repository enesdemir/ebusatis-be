import {
  Entity,
  Property,
  Enum,
  ManyToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';

/**
 * Product collection type.
 *
 * Collections group products across seasons, marketing campaigns or
 * permanent catalogue lines so the sales team can browse and share
 * them quickly.
 */
export enum CollectionType {
  SEASONAL = 'SEASONAL',
  THEMED = 'THEMED',
  CAMPAIGN = 'CAMPAIGN',
  PERMANENT = 'PERMANENT',
}

/**
 * Product Collection
 *
 * Groups products into curated sets — e.g. "2026 Spring/Summer",
 * "Premium Velvet Line" or "Trade Fair Istanbul 2026". Each product
 * can belong to many collections and each collection can span many
 * products (ManyToMany).
 *
 * Replaces the previous loose `Product.collectionName: string` field
 * with a proper entity that supports lifecycle (launch/end dates),
 * typing and a cover image.
 */
@Entity({ tableName: 'product_collections' })
export class ProductCollection extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property()
  @Index()
  code!: string; // tenant-unique, e.g. "2026-SS"

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Enum(() => CollectionType)
  type: CollectionType = CollectionType.SEASONAL;

  /** Season tag — convention: "YYYY_SS" or "YYYY_FW". */
  @Property({ nullable: true })
  season?: string;

  @Property({ nullable: true, type: 'date' })
  launchDate?: Date;

  @Property({ nullable: true, type: 'date' })
  endDate?: Date;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true })
  coverImageUrl?: string;

  @ManyToMany({ entity: () => Product, inversedBy: 'collections' })
  products = new Collection<Product>(this);
}
