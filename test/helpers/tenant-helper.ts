import { EntityManager } from '@mikro-orm/core';
import { v4 } from 'uuid';

/**
 * Test icin tenant helper'lari.
 * Hizlica test tenant'i olustur, izolasyon kontrol et.
 */
export class TenantHelper {
  constructor(private em: EntityManager) {}

  /** Test tenant'i olustur */
  async createTenant(name = 'Test Tenant', domain = 'test'): Promise<string> {
    const id = v4();
    await this.em.getConnection().execute(
      `INSERT INTO tenants (id, name, domain, is_active, created_at, updated_at) VALUES (?, ?, ?, true, now(), now())`,
      [id, name, domain],
    );
    return id;
  }

  /** Test kullanicisi olustur (tenant'a bagli) */
  async createUser(
    tenantId: string,
    email = 'user@test.com',
    passwordHash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12', // dummy hash
    isSuperAdmin = false,
  ): Promise<string> {
    const id = v4();
    await this.em.getConnection().execute(
      `INSERT INTO users (id, email, password_hash, tenant_id, is_super_admin, is_active, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, true, 'tr', now(), now())`,
      [id, email, passwordHash, tenantId, isSuperAdmin],
    );
    return id;
  }

  /** Iki farkli tenant olustur (izolasyon testi icin) */
  async createTwoTenants(): Promise<{ tenantA: string; tenantB: string }> {
    const tenantA = await this.createTenant('Tenant A', 'tenant-a');
    const tenantB = await this.createTenant('Tenant B', 'tenant-b');
    return { tenantA, tenantB };
  }
}
