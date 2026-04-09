import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';
import { ClassificationNode } from '../../classifications/entities/classification-node.entity';

export enum AddressType {
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  BOTH = 'BOTH',
}

/**
 * İş Ortağı Adresi
 * Nerede kullanılır: SalesOrder.deliveryAddress, Invoice fatura adresi
 *
 * country/state/city → ClassificationNode relation (COUNTRY/STATE/CITY)
 * countryName/stateName/cityName → Denormalize text (arama/listeleme kolaylığı)
 */
@Entity({ tableName: 'partner_addresses' })
export class PartnerAddress extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  partner!: Partner;

  @Enum(() => AddressType)
  type: AddressType = AddressType.BOTH;

  @Property({ nullable: true })
  label?: string; // "Merkez Ofis", "Fabrika"

  @Property({ nullable: true })
  addressLine1?: string;

  @Property({ nullable: true })
  addressLine2?: string;

  @ManyToOne(() => ClassificationNode, { nullable: true })
  country?: ClassificationNode;

  @Property({ nullable: true })
  countryName?: string;

  @ManyToOne(() => ClassificationNode, { nullable: true })
  state?: ClassificationNode;

  @Property({ nullable: true })
  stateName?: string;

  @ManyToOne(() => ClassificationNode, { nullable: true })
  city?: ClassificationNode;

  @Property({ nullable: true })
  cityName?: string;

  @Property({ nullable: true })
  district?: string;

  @Property({ nullable: true })
  postalCode?: string;

  @Property({ default: false })
  isDefault: boolean = false;
}
