import { Entity, Property, Enum, ManyToOne, OneToMany, Collection, Unique } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Warehouse } from './warehouse.entity';

export enum LocationType {
  ZONE = 'ZONE',
  AISLE = 'AISLE',
  SHELF = 'SHELF',
  BIN = 'BIN',
  FLOOR = 'FLOOR',
}

/**
 * Depo Lokasyonu (Warehouse Location) - Ağaç Yapı
 *
 * Ne işe yarar: Depo içindeki raf/bölge/kat yapısı.
 * Nerede kullanılır: InventoryItem.location, mal kabul, sayım
 */
@Entity({ tableName: 'warehouse_locations' })
@Unique({ properties: ['warehouse', 'code'] })
export class WarehouseLocation extends BaseTenantEntity {
  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  @Property()
  name!: string;

  @Property()
  code!: string; // "A-12", "B-01"

  @Enum(() => LocationType)
  type: LocationType = LocationType.SHELF;

  @ManyToOne(() => WarehouseLocation, { nullable: true })
  parent?: WarehouseLocation;

  @OneToMany(() => WarehouseLocation, loc => loc.parent)
  children = new Collection<WarehouseLocation>(this);

  @Property({ type: 'json', nullable: true })
  capacity?: Record<string, number>; // { maxRolls: 50, maxWeight: 1000 }

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 0 })
  sortOrder: number = 0;
}
