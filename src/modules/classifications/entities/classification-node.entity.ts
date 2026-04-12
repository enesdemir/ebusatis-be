import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
  Unique,
  Filter,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { v4 } from 'uuid';

/**
 * Jenerik agac yapili siniflandirma sistemi.
 *
 * Tek tabloda, self-referencing tree yapiyla, multi-tenant ve cok dilli
 * tum siniflandirma tiplerini yonetir:
 *
 *   PRODUCT_CATEGORY, UNIT_OF_MEASURE, CURRENCY, PAYMENT_METHOD,
 *   DELIVERY_METHOD, TAG, WAREHOUSE, ORDER_STATUS, INVOICE_STATUS,
 *   COUNTRY, STATE, CITY, REGION, SUBREGION, FABRIC_TYPE, ...
 *
 * Her tip ayni tabloyu paylasiyor, classificationType + tenantId kombinasyonu
 * ile izole ediliyor.
 *
 * Lokasyon verileri (COUNTRY/STATE/CITY) tenant=null, isSystem=true olarak
 * seed edilir — tum tenantlar tarafindan paylasilan platform verisi.
 */
@Entity({ tableName: 'classification_nodes' })
@Unique({
  properties: ['tenant', 'classificationType', 'code'],
  name: 'uq_classification_tenant_type_code',
})
@Index({ properties: ['classificationType'], name: 'idx_classification_type' })
@Index({
  properties: ['tenant', 'classificationType'],
  name: 'idx_classification_tenant_type',
})
@Index({ properties: ['path'], name: 'idx_classification_path' })
@Index({ properties: ['module'], name: 'idx_classification_module' })
@Filter({
  name: 'tenant',
  cond: (args: { tenantId: string }) => ({
    $or: [
      { tenant: { id: args.tenantId } },
      { tenant: null }, // Platform-scoped (lokasyon, sistem verileri)
    ],
  }),
  default: true,
})
export class ClassificationNode extends BaseEntity {
  // ── Tenant (nullable: COUNTRY/STATE/CITY gibi platform verileri tenant'a ait degil) ──
  @ManyToOne(() => Tenant, { nullable: true })
  @Index()
  tenant?: Tenant;

  // ── Classification Type ──
  @Property({ length: 50 })
  classificationType!: string;

  // ── Module (hangi is alanina ait) ──
  @Property({ length: 50 })
  module!: string;

  // ── Tree Structure ──
  @ManyToOne(() => ClassificationNode, { nullable: true })
  parent?: ClassificationNode;

  @OneToMany(() => ClassificationNode, (n) => n.parent)
  children = new Collection<ClassificationNode>(this);

  @Property({ length: 1000 })
  path: string = '';

  @Property()
  depth: number = 0;

  // ── Identity ──
  @Property({ length: 100 })
  code!: string;

  @Property({ type: 'uuid' })
  key: string = v4();

  // ── i18n ──
  @Property({ type: 'json' })
  names!: Record<string, string>;

  @Property({ type: 'json', nullable: true })
  descriptions?: Record<string, string>;

  // ── Metadata ──
  @Property({ type: 'json', nullable: true })
  properties?: Record<string, unknown>;

  @Property({ type: 'array', nullable: true })
  tags?: string[];

  @Property({ nullable: true, length: 50 })
  icon?: string;

  @Property({ nullable: true, length: 20 })
  color?: string;

  // ── Flags ──
  @Property()
  isRoot: boolean = false;

  @Property()
  isSystem: boolean = false;

  @Property()
  isActive: boolean = true;

  @Property()
  selectable: boolean = true;

  @Property()
  sortOrder: number = 0;

  // ── Helper ──
  constructor(
    type: string,
    module: string,
    code: string,
    names: Record<string, string>,
  ) {
    super();
    this.classificationType = type;
    this.module = module;
    this.code = code;
    this.names = names;
  }
}
