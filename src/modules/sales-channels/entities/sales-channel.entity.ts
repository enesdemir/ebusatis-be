import { Entity, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export enum ChannelType {
  MARKETPLACE = 'MARKETPLACE',
  B2B_PORTAL = 'B2B_PORTAL',
  WEBSHOP = 'WEBSHOP',
  POS = 'POS',
}

/**
 * Satis Kanali — Trendyol, Hepsiburada, Amazon, Shopify vb. entegrasyonlar.
 */
@Entity({ tableName: 'sales_channels' })
export class SalesChannel extends BaseTenantEntity {
  @Property()
  name!: string;

  @Enum(() => ChannelType)
  type: ChannelType = ChannelType.MARKETPLACE;

  @Property({ nullable: true })
  platform?: string; // trendyol, hepsiburada, amazon, shopify, n11, etsy

  @Property({ nullable: true })
  apiUrl?: string;

  @Property({ type: 'json', nullable: true })
  credentials?: Record<string, unknown>; // Sifrelenmis API anahtarlari

  @Property({ type: 'json', nullable: true })
  syncSettings?: Record<string, unknown>; // { autoSync, syncInterval, stockBuffer }

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'datetime' })
  lastSyncAt?: Date;

  @Property({ nullable: true })
  note?: string;

  @OneToMany('ChannelProductMapping', 'channel')
  productMappings = new Collection<object>(this);
}
