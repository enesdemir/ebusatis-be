import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export enum DocumentLinkType {
  CREATED_FROM = 'CREATED_FROM',
  PARTIAL = 'PARTIAL',
  RETURN = 'RETURN',
  CORRECTION = 'CORRECTION',
}

/**
 * Document Link
 *
 * Captures the parent/child relationship between business documents:
 * an order spawns a shipment, the shipment becomes an invoice, the
 * invoice gets paid, etc. Used by the "linked documents" tree shown on
 * any document detail screen.
 *
 * Example chain: SalesOrder → Shipment → Invoice → Payment
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
