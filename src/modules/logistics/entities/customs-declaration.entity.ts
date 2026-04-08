import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ShipmentPlan } from './shipment-plan.entity';

export enum CustomsStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Gumruk Beyannamesi — Ithalat/ihracat evrak yonetimi.
 * GTD (Таможенная декларация) formati destegi.
 */
@Entity({ tableName: 'customs_declarations' })
export class CustomsDeclaration extends BaseTenantEntity {
  @Property()
  declarationNumber!: string;

  @ManyToOne(() => ShipmentPlan, { nullable: true })
  shipmentPlan?: ShipmentPlan;

  @Enum(() => CustomsStatus)
  status: CustomsStatus = CustomsStatus.DRAFT;

  @Property({ nullable: true })
  declarationType?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  customsDuty: number = 0;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  customsVAT: number = 0;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number = 0;

  @Property({ nullable: true })
  currency?: string;

  @Property({ nullable: true, type: 'date' })
  submittedAt?: Date;

  @Property({ nullable: true, type: 'date' })
  approvedAt?: Date;

  @Property({ nullable: true })
  note?: string;

  @Property({ type: 'json', nullable: true })
  documents?: Array<{ name: string; type: string; url?: string }>;
}
