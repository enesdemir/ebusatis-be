import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum TaxType {
  VAT = 'VAT',
  WITHHOLDING = 'WITHHOLDING',
  CUSTOMS = 'CUSTOMS',
  EXEMPT = 'EXEMPT',
}

/**
 * Vergi Oranı Tanımı (Tax Rate)
 *
 * Ne işe yarar: KDV oranları, vergi grupları. Fatura ve fiyatlandırmada kullanılır.
 * Nerede kullanılır: Product.taxRate, InvoiceLine.taxRate, OrderLine.taxRate
 */
@Entity({ tableName: 'tax_rates' })
@Unique({ properties: ['tenant', 'code'] })
export class TaxRate extends BaseDefinitionEntity {
  @Property({ type: 'decimal', precision: 5, scale: 2 })
  rate!: number; // Oran: 20.00 (%)

  @Enum(() => TaxType)
  type: TaxType = TaxType.VAT;

  @Property({ default: false })
  isDefault: boolean = false;

  @Property({ default: false })
  isInclusive: boolean = false; // Fiyata dahil mi? (KDV dahil/hariç)
}
