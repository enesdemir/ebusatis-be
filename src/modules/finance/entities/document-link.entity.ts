import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export enum DocumentLinkType {
  CREATED_FROM = 'CREATED_FROM',
  PARTIAL = 'PARTIAL',
  RETURN = 'RETURN',
  CORRECTION = 'CORRECTION',
}

/**
 * Belge Bağlantı Grafiği (Document Link)
 *
 * Ne işe yarar: Belgelerin ata-soy ilişkisi. Bir siparişten türeyen irsaliye, fatura, ödeme zinciri.
 * Nerede kullanılır: Herhangi bir belgenin detayında "Bağlı Belgeler" ağacı
 *
 * Örnek: SalesOrder → Shipment → Invoice → Payment
 */
@Entity({ tableName: 'document_links' })
export class DocumentLink extends BaseTenantEntity {
  @Property()
  sourceType!: string; // 'SalesOrder', 'Invoice', 'Payment', 'Shipment'

  @Property()
  sourceId!: string;

  @Property()
  targetType!: string;

  @Property()
  targetId!: string;

  @Enum(() => DocumentLinkType)
  linkType: DocumentLinkType = DocumentLinkType.CREATED_FROM;
}
