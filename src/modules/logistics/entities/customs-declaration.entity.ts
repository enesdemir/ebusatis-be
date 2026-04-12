import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { Currency } from '../../definitions/entities/currency.entity';

export enum CustomsStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Customs Declaration
 *
 * Captures the customs paperwork and cost breakdown for a shipment
 * crossing a border (typically INBOUND in the international-import
 * flow). Customs costs feed into the landed-cost calculation that
 * stage 0.C will introduce.
 */
@Entity({ tableName: 'customs_declarations' })
export class CustomsDeclaration extends BaseTenantEntity {
  @Property()
  declarationNumber!: string;

  @ManyToOne(() => Shipment, { nullable: true })
  @Index()
  shipment?: Shipment;

  @Enum(() => CustomsStatus)
  status: CustomsStatus = CustomsStatus.DRAFT;

  /** Free-text declaration type (e.g. "IMPORT", "EXPORT", "TRANSIT"). */
  @Property({ nullable: true })
  declarationType?: string;

  // ── Cost breakdown ──

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customsDuty: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customsVat: number = 0;

  /** Customs broker fee (added in stage 0.B for landed-cost completeness). */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  brokerFee: number = 0;

  /** Optional cargo insurance cost. */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  insuranceCost: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCost: number = 0;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  // ── Dates ──

  @Property({ nullable: true, type: 'date' })
  submittedAt?: Date;

  @Property({ nullable: true, type: 'date' })
  approvedAt?: Date;

  // ── Misc ──

  @Property({ nullable: true, type: 'text' })
  note?: string;

  /** Attached documents (filename, MIME type, optional URL). */
  @Property({ type: 'jsonb', nullable: true })
  documents?: Array<{ name: string; type: string; url?: string }>;
}
