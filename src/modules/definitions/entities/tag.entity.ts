import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

/**
 * Etiket (Tag)
 *
 * Ne işe yarar: Kullanıcının kendi etiketlerini oluşturması. Filtreleme ve gruplama için.
 * Nerede kullanılır: Product, SalesOrder, Partner, InventoryItem üzerine etiket atama
 */
@Entity({ tableName: 'tags' })
@Unique({ properties: ['tenant', 'code'] })
export class Tag extends BaseDefinitionEntity {
  @Property()
  color!: string; // Hex renk kodu

  @Property({ nullable: true })
  icon?: string; // Lucide icon adı

  @Property({ type: 'json', default: '[]' })
  entityTypes: string[] = []; // ['PRODUCT', 'ORDER', 'PARTNER', 'ROLL']
}
