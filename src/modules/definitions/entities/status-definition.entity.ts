import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum StatusEntityType {
  ORDER = 'ORDER',
  INVOICE = 'INVOICE',
  PURCHASE = 'PURCHASE',
  PRODUCTION = 'PRODUCTION',
  SHIPMENT = 'SHIPMENT',
}

/**
 * Durum Tanımı (Status Definition)
 *
 * Ne işe yarar: İş akışı durumlarını ve izin verilen geçişleri tanımlar.
 * Nerede kullanılır: SalesOrder.status, Invoice.status, PurchaseOrder.status
 *
 * Örnek (Sipariş):
 *   DRAFT → [CONFIRMED, CANCELLED]
 *   CONFIRMED → [PROCESSING, CANCELLED]
 *   PROCESSING → [SHIPPED, CANCELLED]
 *   SHIPPED → [DELIVERED]
 *   DELIVERED → [RETURNED]
 */
@Entity({ tableName: 'status_definitions' })
@Unique({ properties: ['tenant', 'code', 'entityType'] })
export class StatusDefinition extends BaseDefinitionEntity {
  @Enum(() => StatusEntityType)
  entityType!: StatusEntityType;

  @Property()
  color!: string; // Hex renk kodu

  @Property({ nullable: true })
  icon?: string; // Lucide icon adı

  @Property({ default: false })
  isFinal: boolean = false; // Son durum mu? (Tamamlandı, İptal)

  @Property({ default: false })
  isDefault: boolean = false; // Yeni kayıtlarda varsayılan durum

  @Property({ type: 'json', default: '[]' })
  allowedTransitions: string[] = []; // Geçiş yapabileceği durum code'ları
}
