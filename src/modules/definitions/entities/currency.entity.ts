import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum CurrencyPosition {
  PREFIX = 'PREFIX',   // $100
  SUFFIX = 'SUFFIX',   // 100₺
}

/**
 * Para Birimi Tanımı (Currency)
 *
 * Ne işe yarar: Çoklu döviz desteği. Alış USD, satış TRY olabilir.
 * Nerede kullanılır: ProductVariant.price, SalesOrder.currency, Invoice.currency, SupplierPriceList.currency
 */
@Entity({ tableName: 'currencies' })
@Unique({ properties: ['tenant', 'code'] })
export class Currency extends BaseDefinitionEntity {
  @Property()
  symbol!: string; // "₺", "$", "€", "₽"

  @Property({ default: 2 })
  decimalPlaces: number = 2;

  @Property({ default: false })
  isDefault: boolean = false; // Tenant'ın varsayılan para birimi

  @Enum(() => CurrencyPosition)
  position: CurrencyPosition = CurrencyPosition.SUFFIX;
}
