import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ShipmentPlan } from './shipment-plan.entity';

/**
 * Konteyner Olay — Sevkiyat timeline'indaki her adim.
 * Orn: Yuklenme, Limandan Ayrildi, Transit, Gumrukte, Teslim Edildi
 */
@Entity({ tableName: 'container_events' })
export class ContainerEvent extends BaseTenantEntity {
  @ManyToOne(() => ShipmentPlan)
  shipmentPlan!: ShipmentPlan;

  @Property()
  eventType!: string;

  @Property({ nullable: true })
  location?: string;

  @Property({ type: 'datetime' })
  eventDate!: Date;

  @Property({ nullable: true })
  note?: string;
}
