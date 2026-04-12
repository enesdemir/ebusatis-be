import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Currency } from '../../definitions/entities/currency.entity';

/**
 * Tedarikçi Fiyat Listesi (Supplier Price List)
 *
 * Ne işe yarar: Tedarikçilerin fiyat listelerinin sisteme yüklenebilmesi.
 * Nerede kullanılır: Satınalma siparişlerinde referans fiyat, maliyet hesaplama
 */
@Entity({ tableName: 'supplier_price_lists' })
export class SupplierPriceList extends BaseTenantEntity {
  @ManyToOne(() => Partner)
  supplier!: Partner; // type=SUPPLIER olan partner

  @Property()
  name!: string; // "2026 İlkbahar Listesi"

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ nullable: true, type: 'date' })
  validFrom?: Date;

  @Property({ nullable: true, type: 'date' })
  validTo?: Date;

  @Property({ default: true })
  isActive: boolean = true;

  @OneToMany('SupplierPriceListItem', 'priceList')
  items = new Collection<any>(this);
}
