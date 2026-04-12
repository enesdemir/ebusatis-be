import { Entity, Enum, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';

/**
 * High-level bucket the UI uses to decide icon / colour / grouping.
 *
 * The list mirrors the "system" vs "user upload" split called out in
 * guide §24 (Belge Yönetimi): system-generated PDFs (PO contract,
 * invoice, payment receipt…) live alongside anything the team drops
 * in manually (scanned BOL, customs paperwork, QC photo, …).
 */
export enum DocumentCategory {
  SYSTEM_GENERATED = 'SYSTEM_GENERATED',
  USER_UPLOADED = 'USER_UPLOADED',
}

/**
 * Concrete document type — ~20 values that cover the ERP's document
 * matrix. Extend conservatively; a new value requires a migration.
 */
export enum DocumentType {
  // System-generated PDFs
  PO_CONTRACT = 'PO_CONTRACT',
  SALES_ORDER_CONFIRMATION = 'SALES_ORDER_CONFIRMATION',
  INVOICE = 'INVOICE',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  SHIPMENT_DOC = 'SHIPMENT_DOC',
  CLAIM_REPORT = 'CLAIM_REPORT',
  KARTELA_LABEL = 'KARTELA_LABEL',
  CUSTOMER_TRANSFER = 'CUSTOMER_TRANSFER',

  // User-uploaded
  SUPPLIER_INVOICE = 'SUPPLIER_INVOICE',
  BILL_OF_LADING = 'BILL_OF_LADING',
  CUSTOMS_DECLARATION = 'CUSTOMS_DECLARATION',
  PACKING_LIST = 'PACKING_LIST',
  QC_REPORT = 'QC_REPORT',
  QC_PHOTO = 'QC_PHOTO',
  BANK_RECEIPT = 'BANK_RECEIPT',
  CONTRACT = 'CONTRACT',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER',
}

/**
 * Document
 *
 * One uploaded (or system-generated) file attached to a business
 * entity. Lives independently of the entity so an order, a shipment
 * and a claim can all link to the same file, and versioning works
 * without touching the parent.
 *
 * Multi-tenant: extends `BaseTenantEntity` so rows are automatically
 * filtered by tenant and must be created with a tenant reference.
 *
 * Versioning: a replacement upload creates a new row and points
 * `replacedBy` from the old row forward. Download resolvers skip rows
 * whose `replacedBy` is set unless the caller explicitly asks for
 * history.
 */
@Entity({ tableName: 'documents' })
export class Document extends BaseTenantEntity {
  @Enum(() => DocumentCategory)
  category: DocumentCategory = DocumentCategory.USER_UPLOADED;

  @Enum(() => DocumentType)
  @Index()
  documentType!: DocumentType;

  /** The business entity this document is attached to. */
  @Property()
  @Index()
  entityType!: string; // 'PurchaseOrder', 'SalesOrder', 'GoodsReceive', …

  @Property()
  @Index()
  entityId!: string;

  // ── File metadata ──

  /** Original upload file name, preserved for UI display. */
  @Property()
  fileName!: string;

  @Property()
  mimeType!: string;

  @Property()
  fileSize!: number;

  /** Object-storage key returned by MinIO on upload. */
  @Property()
  storageKey!: string;

  // ── Versioning ──

  @Property({ default: 1 })
  version: number = 1;

  @ManyToOne(() => Document, { nullable: true })
  replacedBy?: Document;

  // ── Optional metadata ──

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Property({ type: 'jsonb', nullable: true })
  tags?: string[];

  @ManyToOne(() => User, { nullable: true })
  uploadedBy?: User;

  @Property({ type: 'datetime' })
  uploadedAt: Date = new Date();
}
