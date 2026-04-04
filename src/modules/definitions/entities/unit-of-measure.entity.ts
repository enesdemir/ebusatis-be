import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum UnitCategory {
  LENGTH = 'LENGTH',
  WEIGHT = 'WEIGHT',
  AREA = 'AREA',
  PIECE = 'PIECE',
  VOLUME = 'VOLUME',
}

/**
 * Birim Tanımı (Unit of Measure)
 *
 * Ne işe yarar: Ürünlerin ölçü birimi. Tekstilde Metre, Kilogram, Yard, Adet, Top gibi birimler.
 * Nerede kullanılır: Product.baseUnit, InventoryItem.quantity, OrderLine.quantity, Raporlama
 */
@Entity({ tableName: 'units_of_measure' })
@Unique({ properties: ['tenant', 'code'] })
export class UnitOfMeasure extends BaseDefinitionEntity {
  @Enum(() => UnitCategory)
  category!: UnitCategory;

  @Property()
  symbol!: string; // "m", "kg", "yd", "adet"

  @Property({ type: 'decimal', precision: 10, scale: 6, default: 1 })
  baseConversionFactor: number = 1; // 1 yard = 0.9144 metre

  @Property({ default: 2 })
  decimalPrecision: number = 2; // Kaç ondalık (metre=2, adet=0)

  @Property({ default: false })
  isBaseUnit: boolean = false; // Kategorisindeki temel birim mi?
}
