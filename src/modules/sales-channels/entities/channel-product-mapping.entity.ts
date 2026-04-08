import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SalesChannel } from './sales-channel.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  ERROR = 'ERROR',
  NOT_LISTED = 'NOT_LISTED',
}

/**
 * Kanal-Urun Eslestirme — Ic urun ile kanal urunu arasindaki mapping.
 */
@Entity({ tableName: 'channel_product_mappings' })
export class ChannelProductMapping extends BaseTenantEntity {
  @ManyToOne(() => SalesChannel)
  channel!: SalesChannel;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ nullable: true })
  externalId?: string; // Kanal tarafindaki urun ID

  @Property({ nullable: true })
  externalSku?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  channelPrice?: number;

  @Property({ nullable: true })
  syncedQuantity?: number;

  @Enum(() => SyncStatus)
  syncStatus: SyncStatus = SyncStatus.PENDING;

  @Property({ nullable: true, type: 'datetime' })
  lastSyncAt?: Date;

  @Property({ nullable: true })
  syncError?: string;
}
