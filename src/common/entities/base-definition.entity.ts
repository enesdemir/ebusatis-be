import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseTenantEntity } from './base-tenant.entity';

/**
 * Tanım verilerinin kapsamı.
 * SYSTEM_SEED: Tenant oluşturulduğunda platform tarafından otomatik kopyalanan şablon.
 *              Tenant kendi kopyasını düzenleyebilir/silebilir.
 * TENANT:      Tenant'ın kendi oluşturduğu tanım.
 */
export enum DefinitionScope {
  SYSTEM_SEED = 'SYSTEM_SEED',
  TENANT = 'TENANT',
}

/**
 * Tüm tanım (master data) entity'lerinin base class'ı.
 * BaseTenantEntity'den türer → otomatik tenant izolasyonu.
 *
 * Ortak alanlar: name, code, description, isActive, sortOrder, scope
 *
 * Unique constraint: (tenant, code) → Aynı tenant içinde aynı code olamaz,
 * ama farklı tenant'lar aynı code'u kullanabilir.
 */
@Entity({ abstract: true })
export abstract class BaseDefinitionEntity extends BaseTenantEntity {
  @Property()
  name!: string;

  @Property()
  code!: string;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ default: 0 })
  sortOrder: number = 0;

  @Enum(() => DefinitionScope)
  scope: DefinitionScope = DefinitionScope.TENANT;
}
