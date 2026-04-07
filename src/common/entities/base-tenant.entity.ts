import { Entity, Filter, ManyToOne, Index } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

/**
 * Tüm tenant-scoped entity'lerin base class'ı.
 * MikroORM @Filter ile otomatik tenant izolasyonu sağlar.
 *
 * TenantContextMiddleware her request'te setFilterParams çağırır:
 * - x-tenant-id header varsa → gerçek tenantId set edilir
 * - Header yoksa → sahte UUID set edilir (platform endpoint'leri boş sonuç döner)
 *
 * Kullanım:
 *   @Entity()
 *   class Product extends BaseTenantEntity { ... }
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
