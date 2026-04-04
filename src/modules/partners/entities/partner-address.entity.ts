import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from './partner.entity';

export enum AddressType {
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  BOTH = 'BOTH',
}

/**
 * İş Ortağı Adresi
 * Nerede kullanılır: SalesOrder.deliveryAddress, Invoice fatura adresi
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

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
  district?: string;

  @Property({ nullable: true })
  postalCode?: string;

  @Property({ nullable: true })
  country?: string;

  @Property({ default: false })
  isDefault: boolean = false;
}
