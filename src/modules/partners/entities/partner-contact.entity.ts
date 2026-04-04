import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';

/**
 * İş Ortağı İletişim Kişisi
 * Nerede kullanılır: Sipariş iletişim, CRM etkileşim, teklif gönderimi
 */
@Entity({ tableName: 'partner_contacts' })
export class PartnerContact extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  partner!: Partner;

  @Property()
  fullName!: string;

  @Property({ nullable: true })
  title?: string; // "Satın Alma Müdürü"

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ default: false })
  isPrimary: boolean = false;

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
