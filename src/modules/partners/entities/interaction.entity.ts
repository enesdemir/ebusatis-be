import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';
import { User } from '../../users/entities/user.entity';

export enum InteractionType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  VISIT = 'VISIT',
  OFFER = 'OFFER',
}

/**
 * CRM Etkileşim Geçmişi (Interaction Log)
 *
 * Ne işe yarar: Müşteriyle yapılan görüşmelerin loglanması.
 * Nerede kullanılır: Partner detay sayfasında "İletişim" tab'ı, CRM raporları
 */
@Entity({ tableName: 'interactions' })
export class Interaction extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  partner!: Partner;

  @Enum(() => InteractionType)
  type!: InteractionType;

  @Property()
  summary!: string; // Kısa özet

  @Property({ nullable: true, type: 'text' })
  details?: string; // Detaylı notlar

  @Property({ nullable: true })
  contactPerson?: string; // Görüşülen kişi

  @Property({ nullable: true, type: 'date' })
  nextActionDate?: Date; // Sonraki aksiyon tarihi

  @Property({ nullable: true })
  nextActionNote?: string;

  @ManyToOne(() => User)
  createdBy!: User;
}
