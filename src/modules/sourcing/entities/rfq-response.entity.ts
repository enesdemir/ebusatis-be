import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { RFQ } from './rfq.entity';

@Entity({ tableName: 'rfq_responses' })
export class RFQResponse extends BaseTenantEntity {
  @ManyToOne(() => RFQ) rfq!: RFQ;
  @Property() supplierId!: string;
  @Property({ nullable: true }) supplierName?: string;
  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number = 0;
  @Property({ nullable: true }) currency?: string;
  @Property({ nullable: true }) leadTimeDays?: number;
  @Property({ nullable: true, type: 'date' }) validUntil?: Date;
  @Property({ type: 'json', nullable: true }) lineItems?: Array<{
    variantId: string;
    unitPrice: number;
    moq?: number;
    note?: string;
  }>;
  @Property({ nullable: true }) note?: string;
  @Property({ default: false }) isSelected: boolean = false;
  @Property({ nullable: true, type: 'datetime' }) receivedAt?: Date;
}
