import { Entity, Filter, ManyToOne, Index } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

/**
 * Tüm tenant-scoped entity'lerin base class'ı.
 * MikroORM @Filter ile otomatik tenant izolasyonu sağlar.
 *
 * Kullanım:
 *   @Entity()
 *   class Product extends BaseTenantEntity { ... }
 *
 * Bu sayede `em.find(Product, {})` çağrısı otomatik olarak
 * `WHERE tenant_id = :tenantId` filtresi uygular.
 *
 * SuperAdmin cross-tenant erişimi için:
 *   em.find(Product, {}, { filters: { tenant: false } })
 */
@Filter({
  name: 'tenant',
  cond: (args: { tenantId: string }) => ({ tenant: { id: args.tenantId } }),
  default: true,
})
@Entity({ abstract: true })
export abstract class BaseTenantEntity extends BaseEntity {
  @ManyToOne(() => Tenant)
  @Index()
  tenant!: Tenant;
}
