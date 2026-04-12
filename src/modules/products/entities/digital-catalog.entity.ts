import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Dijital Kartela (Digital Catalog)
 *
 * Ne işe yarar: Satış temsilcisinin B2B müşteriye gönderdiği online ürün kataloğu.
 * Filtreleyip seçilen varyantlardan tek tıkla public link oluşturulur.
 *
 * Nerede kullanılır: PIM > Kartelalar, WhatsApp/Mail ile müşteriye gönderme
 */
@Entity({ tableName: 'digital_catalogs' })
export class DigitalCatalog extends BaseTenantEntity {
  @Property()
  title!: string; // "Hilton Otel Projesi Kumaşları"

  @Property({ unique: true })
  token!: string; // Public link token (UUID veya nanoid)

  @Property({ default: true })
  showPrices: boolean = true;

  @Property({ default: false })
  showStock: boolean = false;

  @Property({ nullable: true, type: 'datetime' })
  expiresAt?: Date;

  @Property({ default: 0 })
  viewCount: number = 0;

  @Property({ default: true })
  isActive: boolean = true;

  @ManyToOne(() => User)
  createdBy!: User;

  // Partner ilişkisi Kademe 2'den - nullable çünkü genel kartela da olabilir
  @Property({ nullable: true })
  partnerId?: string;

  @OneToMany('DigitalCatalogItem', 'catalog')
  items = new Collection<object>(this);
}
