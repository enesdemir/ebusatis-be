import { EntityManager } from '@mikro-orm/core';
import { v4 } from 'uuid';

/**
 * Test helpers for tenant lifecycle.
 *
 * Creates tenants and users via raw SQL to avoid triggering entity
 * hooks, seeders or filter interference — the test suite needs full
 * control over which tenant context is active.
 */
export class TenantHelper {
  constructor(private em: EntityManager) {}

  /** Create a test tenant and return its ID. */
  async createTenant(name = 'Test Tenant', domain = 'test'): Promise<string> {
    const id = v4();
    await this.em
      .getConnection()
      .execute(
        `INSERT INTO tenants (id, name, domain, type, subscription_status, features, created_at, updated_at) VALUES (?, ?, ?, 'SAAS', 'ACTIVE', '{}', now(), now())`,
        [id, name, domain],
      );
    return id;
  }

  /** Create a test user bound to a tenant and return its ID. */
  async createUser(
    tenantId: string,
    email = 'user@test.com',
    passwordHash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12',
    isSuperAdmin = false,
  ): Promise<string> {
    const id = v4();
    await this.em
      .getConnection()
      .execute(
        `INSERT INTO users (id, email, password_hash, tenant_id, is_super_admin, is_active, locale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, true, 'tr', now(), now())`,
        [id, email, passwordHash, tenantId, isSuperAdmin],
      );
    return id;
  }

  /** Create two isolated tenants for cross-tenant isolation tests. */
  async createTwoTenants(): Promise<{ tenantA: string; tenantB: string }> {
    const suffix = Date.now();
    const tenantA = await this.createTenant('Tenant A', `tenant-a-${suffix}`);
    const tenantB = await this.createTenant('Tenant B', `tenant-b-${suffix}`);
    return { tenantA, tenantB };
  }
}
