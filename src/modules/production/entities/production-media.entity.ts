import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductionOrder } from './production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Üretim Medyası — Üretim sürecine ait fotoğraf, video ve belgeler.
 */
@Entity({ tableName: 'production_media' })
export class ProductionMedia extends BaseTenantEntity {
  @ManyToOne(() => ProductionOrder)
  productionOrder!: ProductionOrder;

  @Enum(() => MediaType)
  type: MediaType = MediaType.PHOTO;

  @Property()
  fileName!: string;

  @Property()
  fileUrl!: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ nullable: true })
  milestoneName?: string;

  @ManyToOne(() => User)
  uploadedBy!: User;
}
