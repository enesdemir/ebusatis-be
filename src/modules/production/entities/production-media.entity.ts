import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SupplierProductionOrder } from './supplier-production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Production Media
 *
 * Photos, videos and documents attached to a SupplierProductionOrder.
 * Both internal users and the supplier itself can upload media; the
 * `uploadedBySupplier` flag tells them apart.
 *
 * Typically each milestone (`milestoneCode`) has a handful of media items.
 */
@Entity({ tableName: 'production_media' })
export class ProductionMedia extends BaseTenantEntity {
  @ManyToOne(() => SupplierProductionOrder)
  @Index()
  productionOrder!: SupplierProductionOrder;

  @Enum(() => MediaType)
  type: MediaType = MediaType.PHOTO;

  @Property()
  fileName!: string;

  @Property()
  fileUrl!: string;

  @Property({ nullable: true })
  description?: string;

  /** Milestone code (e.g. "DYEHOUSE", "QC") this media item belongs to. */
  @Property({ nullable: true })
  milestoneCode?: string;

  /** Optional uploader; null when the upload originated from the supplier. */
  @ManyToOne(() => User, { nullable: true })
  uploadedBy?: User;

  /** True when the upload originated from the supplier portal. */
  @Property({ default: false })
  uploadedBySupplier: boolean = false;
}
