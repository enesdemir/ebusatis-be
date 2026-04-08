import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ShipmentPlan } from './shipment-plan.entity';

/**
 * Nakliye Teklifi — Farkli nakliyecilerden fiyat teklifi.
 */
@Entity({ tableName: 'freight_quotes' })
export class FreightQuote extends BaseTenantEntity {
  @ManyToOne(() => ShipmentPlan, { nullable: true })
  shipmentPlan?: ShipmentPlan;

  @Property()
  carrier!: string;

  @Property({ nullable: true })
  route?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Property({ nullable: true })
  currency?: string;

  @Property({ nullable: true })
  transitDays?: number;

  @Property({ nullable: true, type: 'date' })
  validUntil?: Date;

  @Property({ default: false })
  isSelected: boolean = false;

  @Property({ nullable: true })
  note?: string;
}
