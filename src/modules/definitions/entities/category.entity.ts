import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Unique,
} from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

/**
 * Ürün Kategorisi (Category) - Ağaç Yapı
 *
 * Ne işe yarar: Ürün sınıflandırması. Parent-child ile hiyerarşik ağaç.
 * Nerede kullanılır: Product.category, filtreleme, raporlama, EAV attribute grupları
 *
 * Örnek ağaç:
 *   Kumaşlar
 *   ├── Perdelik > Fon Perde, Tül Perde, Stor Perde
 *   ├── Döşemelik > Koltuk Kumaşı, Yastık Kumaşı
 *   └── Aksesuarlar > Bant, Korniş, Klips
 */
@Entity({ tableName: 'categories' })
@Unique({ properties: ['tenant', 'code'] })
export class Category extends BaseDefinitionEntity {
  @ManyToOne(() => Category, { nullable: true })
  parent?: Category;

  @OneToMany(() => Category, (cat) => cat.parent)
  children = new Collection<Category>(this);

  @Property({ nullable: true })
  icon?: string; // Lucide icon adı

  @Property({ nullable: true })
  color?: string; // Hex renk kodu

  @Property({ default: 0 })
  depth: number = 0; // Ağaç derinliği (0=kök)
}
