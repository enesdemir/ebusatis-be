import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  OneToMany,
  Collection,
  Unique,
  Index,
} from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';
import { User } from '../../users/entities/user.entity';

export enum WarehouseType {
  MAIN = 'MAIN',
  BRANCH = 'BRANCH',
  SHOWROOM = 'SHOWROOM',
  TRANSIT = 'TRANSIT',
  RETURN = 'RETURN',
  PRODUCTION = 'PRODUCTION',
  CONSIGNMENT = 'CONSIGNMENT',
}

/**
 * Warehouse
 *
 * Physical warehouse definition. Supports hierarchy via `parent` self-
 * reference: e.g. HQ → Istanbul Branch → Istanbul Showroom.
 *
 * Stage 0.C additions: BRANCH and SHOWROOM types, `parent` FK for
 * multi-level warehouse hierarchy.
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
  legalEntity?: string;

  @ManyToOne(() => User, { nullable: true })
  manager?: User;

  /**
   * Parent warehouse for hierarchy (e.g. HQ → Branch → Sub-depot).
   * Null for top-level warehouses.
   */
  @ManyToOne(() => Warehouse, { nullable: true })
  @Index()
  parent?: Warehouse;

  @OneToMany('WarehouseLocation', 'warehouse')
  locations = new Collection<object>(this);
}
