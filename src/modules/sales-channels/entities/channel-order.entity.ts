import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SalesChannel } from './sales-channel.entity';

/**
 * Kanal Siparisi — Marketplace'lerden gelen siparisler.
 */
@Entity({ tableName: 'channel_orders' })
export class ChannelOrder extends BaseTenantEntity {
  @ManyToOne(() => SalesChannel)
  channel!: SalesChannel;

  @Property()
  externalOrderId!: string;

  @Property({ nullable: true })
  externalStatus?: string;

  @Property({ type: 'json', nullable: true })
  orderData?: Record<string, any>; // Kanalin ham siparis verisi

  @Property({ nullable: true })
  linkedSalesOrderId?: string; // Ic siparis ID'si

  @Property({ nullable: true })
  syncStatus?: string;

  @Property({ nullable: true, type: 'datetime' })
  syncedAt?: Date;

  @Property({ nullable: true })
  note?: string;
}
