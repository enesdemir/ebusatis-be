import { Entity, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum ShipmentPlanStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_CUSTOMS = 'AT_CUSTOMS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Sevkiyat Plani — Konteyner/nakliye planlamasi.
 * Tekstil ihracatinda: Turkiye → Rusya, Turkiye → AB rotalari.
 */
@Entity({ tableName: 'shipment_plans' })
export class ShipmentPlan extends BaseTenantEntity {
  @Property()
  planNumber!: string;

  @Enum(() => ShipmentPlanStatus)
  status: ShipmentPlanStatus = ShipmentPlanStatus.DRAFT;

  @Property({ nullable: true })
  origin?: string;

  @Property({ nullable: true })
  destination?: string;

  @Property({ nullable: true })
  incoterm?: string;

  // Konteyner bilgisi
  @Property({ nullable: true })
  containerNo?: string;

  @Property({ nullable: true })
  containerType?: string;

  @Property({ nullable: true })
  sealNo?: string;

  @Property({ nullable: true })
  vessel?: string;

  @Property({ nullable: true })
  voyageNo?: string;

  // Tarihler
  @Property({ nullable: true, type: 'date' })
  estimatedDeparture?: Date;

  @Property({ nullable: true, type: 'date' })
  estimatedArrival?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualDeparture?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualArrival?: Date;

  // Nakliye maliyeti
  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freightCost: number = 0;

  @Property({ nullable: true })
  freightCurrency?: string;

  @Property({ nullable: true })
  carrier?: string;

  @Property({ nullable: true })
  trackingUrl?: string;

  @Property({ nullable: true })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @Property({ type: 'json', nullable: true })
  linkedOrderIds?: string[];

  @OneToMany('ContainerEvent', 'shipmentPlan')
  events = new Collection<any>(this);
}
