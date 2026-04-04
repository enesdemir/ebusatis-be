import { Entity, Property, Enum, ManyToOne, OneToMany, Collection, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';
import { User } from '../../users/entities/user.entity';

export enum WarehouseType {
  MAIN = 'MAIN',
  TRANSIT = 'TRANSIT',
  RETURN = 'RETURN',
  PRODUCTION = 'PRODUCTION',
  CONSIGNMENT = 'CONSIGNMENT',
}

/**
 * Depo Tanımı (Warehouse)
 *
 * Ne işe yarar: Fiziksel depo adresleri. Çoklu depo operasyonları (Kazan, Ufa, Moskova) için zorunlu.
 * Nerede kullanılır: InventoryItem.warehouse, SalesOrder.warehouse, GoodsReceive.warehouse, Transfer, Raporlama
 */
@Entity({ tableName: 'warehouses' })
@Unique({ properties: ['tenant', 'code'] })
export class Warehouse extends BaseDefinitionEntity {
  @Property({ nullable: true })
  address?: string;

  @Property({ nullable: true })
  city?: string;

  @Property({ nullable: true })
  country?: string;

  @Enum(() => WarehouseType)
  type: WarehouseType = WarehouseType.MAIN;

  @Property({ default: false })
  isDefault: boolean = false;

  @Property({ nullable: true })
  legalEntity?: string; // Depoya ait şirket kimliği (Çoklu Alt Şirket)

  @ManyToOne(() => User, { nullable: true })
  manager?: User; // Depo sorumlusu

  @OneToMany('WarehouseLocation', 'warehouse')
  locations = new Collection<any>(this);
}
