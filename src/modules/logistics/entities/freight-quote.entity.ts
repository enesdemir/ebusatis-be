import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { Partner } from '../../partners/entities/partner.entity';

/**
 * Freight Quote
 *
 * A price quote received from a carrier for a planned (or in-progress)
 * shipment. Multiple quotes can be attached to a single shipment so
 * the team can compare options; setting `isSelected = true` marks the
 * quote that has been accepted (only one can be selected at a time
 * per shipment).
 */
@Entity({ tableName: 'freight_quotes' })
export class FreightQuote extends BaseTenantEntity {
  @ManyToOne(() => Shipment, { nullable: true })
  @Index()
  shipment?: Shipment;

  @ManyToOne(() => Partner, { nullable: true })
  carrier?: Partner;

  /** Free-text route, e.g. "Shanghai → Istanbul (via Suez)". */
  @Property({ nullable: true })
  route?: string;

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  price!: number;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ nullable: true })
  transitDays?: number;

  @Property({ nullable: true, type: 'date' })
  validUntil?: Date;

  @Property({ default: false })
  isSelected: boolean = false;

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
