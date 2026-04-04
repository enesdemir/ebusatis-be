import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum DeliveryMethodType {
  CARGO = 'CARGO',
  PICKUP = 'PICKUP',
  OWN_VEHICLE = 'OWN_VEHICLE',
  COURIER = 'COURIER',
  FREIGHT = 'FREIGHT',
}

/**
 * Teslimat Yöntemi (Delivery Method)
 *
 * Ne işe yarar: Siparişlerin müşteriye ulaştırılma şekilleri.
 * Nerede kullanılır: SalesOrder.deliveryMethod, Shipment.deliveryMethod
 */
@Entity({ tableName: 'delivery_methods' })
@Unique({ properties: ['tenant', 'code'] })
export class DeliveryMethod extends BaseDefinitionEntity {
  @Enum(() => DeliveryMethodType)
  type!: DeliveryMethodType;

  @Property({ nullable: true })
  icon?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  defaultCost?: number; // Varsayılan teslimat ücreti

  @Property({ nullable: true })
  estimatedDays?: number; // Tahmini teslimat süresi
}
