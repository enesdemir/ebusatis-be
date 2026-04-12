import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';

/**
 * Standard event types on a shipment timeline.
 *
 * Drives the visibility ladder of a shipment from factory pickup all
 * the way to final delivery. Stage 0.B replaced the previous loose
 * `string` field with this enum so the UI can group, filter and color
 * events deterministically.
 */
export enum ContainerEventType {
  LOADED_AT_FACTORY = 'LOADED_AT_FACTORY',
  IN_TRANSIT_TO_PORT = 'IN_TRANSIT_TO_PORT',
  AT_ORIGIN_PORT = 'AT_ORIGIN_PORT',
  LOADED_ON_VESSEL = 'LOADED_ON_VESSEL',
  IN_TRANSIT_AT_SEA = 'IN_TRANSIT_AT_SEA',
  AT_DESTINATION_PORT = 'AT_DESTINATION_PORT',
  CUSTOMS_HOLD = 'CUSTOMS_HOLD',
  CUSTOMS_CLEARED = 'CUSTOMS_CLEARED',
  IN_TRANSIT_TO_WAREHOUSE = 'IN_TRANSIT_TO_WAREHOUSE',
  ARRIVED_AT_WAREHOUSE = 'ARRIVED_AT_WAREHOUSE',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  EXCEPTION = 'EXCEPTION',
}

/**
 * Container Event
 *
 * One step on a shipment's timeline. Used to render the tracking
 * timeline in the UI and to drive scheduled notifications such as
 * "container x days from estimated arrival".
 */
@Entity({ tableName: 'container_events' })
export class ContainerEvent extends BaseTenantEntity {
  @ManyToOne(() => Shipment)
  @Index()
  shipment!: Shipment;

  @Enum(() => ContainerEventType)
  eventType!: ContainerEventType;

  @Property({ nullable: true })
  location?: string;

  @Property({ type: 'datetime' })
  eventDate!: Date;

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
