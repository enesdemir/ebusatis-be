import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';
import { User } from '../../users/entities/user.entity';

export enum RepRole {
  METRAJ_REP = 'METRAJ_REP',       // Metraj temsilcisi
  KESIM_REP = 'KESIM_REP',         // Kesim temsilcisi
  HAZIR_URUN_REP = 'HAZIR_URUN_REP', // Hazır ürün temsilcisi
  GENERAL = 'GENERAL',             // Genel temsilci
}

/**
 * Satış Temsilcisi Ataması
 *
 * Ne işe yarar: Eski sistemdeki "Türev Bazlı Satış Temsilcisi Ataması".
 * Tek müşteriye satış şekline göre (metraj, kesim, hazır ürün) üç ayrı plasiyer atanabilir.
 */
@Entity({ tableName: 'partner_reps' })
export class PartnerRep extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  partner!: Partner;

  @ManyToOne(() => User)
  user!: User; // Atanan satış temsilcisi

  @Enum(() => RepRole)
  role: RepRole = RepRole.GENERAL;

  @Property({ default: false })
  isPrimary: boolean = false;
}
