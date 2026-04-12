import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantType } from '../modules/tenants/entities/tenant.entity';
import { Role } from '../modules/iam/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Permission } from '../modules/iam/entities/permission.entity';
import {
  UserGroup,
  UserGroupType,
} from '../modules/iam/entities/user-group.entity';

interface PermissionSeed {
  slug: string;
  category: string;
  scope: 'PLATFORM' | 'TENANT';
  description?: string;
}

interface UserGroupSeed {
  code: string;
  name: string;
  description: string;
}

/**
 * Admin seeder — platform bootstrap.
 *
 * Idempotent by design: every record is upserted via findOne-or-create.
 * Running multiple times should produce the same final state.
 *
 * Seeds:
 *   - System tenant (admin.localhost)
 *   - 8 default user groups (departments)
 *   - 4 system roles (SUPER_ADMIN, TENANT_ADMIN, MANAGER, USER)
 *   - 63 permissions across 12 categories
 *   - Role-permission matrix
 *   - Admin user (admin@ebusatis.com / admin123)
 */
export class AdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // ═══════════════════════════════════════════════════════
    //  1. System Tenant
    // ═══════════════════════════════════════════════════════

    let systemTenant = await em.findOne(Tenant, { domain: 'admin.localhost' });
    if (!systemTenant) {
      systemTenant = new Tenant('System Admin', 'admin.localhost');
      systemTenant.type = TenantType.SAAS;
      em.persist(systemTenant);
      console.log('✓ System tenant created: admin.localhost');
    }
    await em.flush();

    // ═══════════════════════════════════════════════════════
    //  2. User Groups (8 departments)
    // ═══════════════════════════════════════════════════════

    const groupSeeds: UserGroupSeed[] = [
      {
        code: 'PURCHASING',
        name: 'Satın Alma',
        description: 'Purchasing department',
      },
      {
        code: 'PLANNING',
        name: 'Planlama',
        description: 'Production planning',
      },
      { code: 'WAREHOUSE', name: 'Depo', description: 'Warehouse operations' },
      {
        code: 'LOGISTICS',
        name: 'Lojistik',
        description: 'Logistics & shipping',
      },
      { code: 'SALES', name: 'Satış', description: 'Sales team' },
      {
        code: 'FINANCE',
        name: 'Muhasebe',
        description: 'Finance & accounting',
      },
      { code: 'QC', name: 'Kalite Kontrol', description: 'Quality control' },
      {
        code: 'MANAGEMENT',
        name: 'Yönetim',
        description: 'Executive management',
      },
    ];

    for (const gs of groupSeeds) {
      const existing = await em.findOne(
        UserGroup,
        { code: gs.code, tenant: systemTenant },
        { filters: false },
      );
      if (!existing) {
        const group = em.create(UserGroup, {
          tenant: systemTenant,
          code: gs.code,
          name: gs.name,
          description: gs.description,
          type: UserGroupType.DEPARTMENT,
          isActive: true,
        } as unknown as UserGroup);
        em.persist(group);
      }
    }
    await em.flush();
    console.log(`✓ ${groupSeeds.length} user groups seeded`);

    // ═══════════════════════════════════════════════════════
    //  3. Permissions (63 across 12 categories)
    // ═══════════════════════════════════════════════════════

    const permissionSeeds: PermissionSeed[] = [
      // Platform (5)
      {
        slug: 'platform.tenants.manage',
        category: 'Platform',
        scope: 'PLATFORM',
        description: 'Manage tenants',
      },
      {
        slug: 'platform.users.manage',
        category: 'Platform',
        scope: 'PLATFORM',
        description: 'Manage platform users',
      },
      {
        slug: 'platform.roles.manage',
        category: 'Platform',
        scope: 'PLATFORM',
        description: 'Manage system roles',
      },
      {
        slug: 'platform.config.manage',
        category: 'Platform',
        scope: 'PLATFORM',
        description: 'Manage platform configuration',
      },
      {
        slug: 'platform.audit.view',
        category: 'Platform',
        scope: 'PLATFORM',
        description: 'View audit logs',
      },

      // Audit (2)
      { slug: 'audit.view', category: 'Audit', scope: 'PLATFORM' },
      { slug: 'audit.export', category: 'Audit', scope: 'PLATFORM' },

      // Partners (4)
      { slug: 'partners.view', category: 'Partners', scope: 'TENANT' },
      { slug: 'partners.create', category: 'Partners', scope: 'TENANT' },
      { slug: 'partners.edit', category: 'Partners', scope: 'TENANT' },
      { slug: 'partners.delete', category: 'Partners', scope: 'TENANT' },

      // Products (5)
      { slug: 'products.view', category: 'Products', scope: 'TENANT' },
      { slug: 'products.create', category: 'Products', scope: 'TENANT' },
      { slug: 'products.edit', category: 'Products', scope: 'TENANT' },
      { slug: 'products.delete', category: 'Products', scope: 'TENANT' },
      { slug: 'products.price.manage', category: 'Products', scope: 'TENANT' },

      // Orders Sales (5)
      { slug: 'orders.sales.view', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.sales.create', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.sales.edit', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.sales.approve', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.sales.delete', category: 'Orders', scope: 'TENANT' },

      // Orders Purchase (5)
      { slug: 'orders.purchase.view', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.purchase.create', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.purchase.edit', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.purchase.approve', category: 'Orders', scope: 'TENANT' },
      { slug: 'orders.purchase.delete', category: 'Orders', scope: 'TENANT' },

      // Inventory (7)
      { slug: 'inventory.view', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.create', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.cut', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.split', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.waste', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.adjust', category: 'Inventory', scope: 'TENANT' },
      { slug: 'inventory.count', category: 'Inventory', scope: 'TENANT' },

      // Logistics (4)
      {
        slug: 'logistics.shipment.view',
        category: 'Logistics',
        scope: 'TENANT',
      },
      {
        slug: 'logistics.shipment.create',
        category: 'Logistics',
        scope: 'TENANT',
      },
      {
        slug: 'logistics.customs.manage',
        category: 'Logistics',
        scope: 'TENANT',
      },
      {
        slug: 'logistics.carrier.payment',
        category: 'Logistics',
        scope: 'TENANT',
      },

      // Production (3)
      { slug: 'production.view', category: 'Production', scope: 'TENANT' },
      {
        slug: 'production.milestone.update',
        category: 'Production',
        scope: 'TENANT',
      },
      { slug: 'production.qc.create', category: 'Production', scope: 'TENANT' },

      // Finance (6)
      { slug: 'finance.invoice.view', category: 'Finance', scope: 'TENANT' },
      { slug: 'finance.invoice.create', category: 'Finance', scope: 'TENANT' },
      { slug: 'finance.invoice.edit', category: 'Finance', scope: 'TENANT' },
      { slug: 'finance.payment.record', category: 'Finance', scope: 'TENANT' },
      { slug: 'finance.payment.approve', category: 'Finance', scope: 'TENANT' },
      { slug: 'finance.ledger.view', category: 'Finance', scope: 'TENANT' },

      // Accounting (3)
      {
        slug: 'accounting.landed-cost.calculate',
        category: 'Accounting',
        scope: 'TENANT',
      },
      {
        slug: 'accounting.exchange.view',
        category: 'Accounting',
        scope: 'TENANT',
      },
      {
        slug: 'accounting.tax.report',
        category: 'Accounting',
        scope: 'TENANT',
      },

      // Reports (3)
      { slug: 'reports.view', category: 'Reports', scope: 'TENANT' },
      { slug: 'reports.export', category: 'Reports', scope: 'TENANT' },
      { slug: 'reports.schedule', category: 'Reports', scope: 'TENANT' },

      // Cross-cutting (6)
      { slug: 'notifications.manage', category: 'Support', scope: 'TENANT' },
      { slug: 'documents.upload', category: 'Support', scope: 'TENANT' },
      { slug: 'documents.download', category: 'Support', scope: 'TENANT' },
      { slug: 'approvals.view', category: 'Support', scope: 'TENANT' },
      { slug: 'approvals.action', category: 'Support', scope: 'TENANT' },
      { slug: 'approvals.delegate', category: 'Support', scope: 'TENANT' },

      // Dashboard (1)
      { slug: 'dashboard.view', category: 'Dashboard', scope: 'TENANT' },
    ];

    const permissionsBySlug = new Map<string, Permission>();
    for (const p of permissionSeeds) {
      let perm = await em.findOne(Permission, { slug: p.slug });
      if (!perm) {
        perm = new Permission(p.slug, p.category, p.scope);
        if (p.description) perm.description = p.description;
        em.persist(perm);
      } else {
        // Keep category/scope up-to-date
        perm.category = p.category;
        perm.assignableScope = p.scope;
        if (p.description) perm.description = p.description;
      }
      permissionsBySlug.set(p.slug, perm);
    }
    await em.flush();
    console.log(`✓ ${permissionSeeds.length} permissions seeded`);

    // ═══════════════════════════════════════════════════════
    //  4. System Roles (4)
    // ═══════════════════════════════════════════════════════

    const roleNames = {
      superAdmin: 'Super Admin',
      tenantAdmin: 'Tenant Admin',
      manager: 'Manager',
      user: 'User',
    };

    const upsertRole = async (name: string): Promise<Role> => {
      const existing = await em.findOne(
        Role,
        { name, tenant: null },
        { populate: ['permissions'] },
      );
      if (existing) return existing as Role;
      const role = new Role(name);
      role.isSystemRole = true;
      em.persist(role);
      return role;
    };

    const superAdmin = await upsertRole(roleNames.superAdmin);
    const tenantAdmin = await upsertRole(roleNames.tenantAdmin);
    const manager = await upsertRole(roleNames.manager);
    const user = await upsertRole(roleNames.user);
    await em.flush();

    // ═══════════════════════════════════════════════════════
    //  5. Role-Permission Matrix
    // ═══════════════════════════════════════════════════════

    const assign = (role: Role, slugs: string[]): void => {
      for (const slug of slugs) {
        const perm = permissionsBySlug.get(slug);
        if (perm && !role.permissions.contains(perm)) {
          role.permissions.add(perm);
        }
      }
    };

    // SUPER_ADMIN: everything
    assign(
      superAdmin,
      permissionSeeds.map((p) => p.slug),
    );

    // TENANT_ADMIN: all TENANT-scoped
    assign(
      tenantAdmin,
      permissionSeeds.filter((p) => p.scope === 'TENANT').map((p) => p.slug),
    );

    // MANAGER: view/create/edit/approve for operational modules (no delete, no platform)
    assign(manager, [
      'partners.view',
      'partners.create',
      'partners.edit',
      'products.view',
      'products.create',
      'products.edit',
      'products.price.manage',
      'orders.sales.view',
      'orders.sales.create',
      'orders.sales.edit',
      'orders.sales.approve',
      'orders.purchase.view',
      'orders.purchase.create',
      'orders.purchase.edit',
      'orders.purchase.approve',
      'inventory.view',
      'inventory.create',
      'inventory.cut',
      'inventory.split',
      'inventory.waste',
      'inventory.adjust',
      'inventory.count',
      'logistics.shipment.view',
      'logistics.shipment.create',
      'logistics.customs.manage',
      'logistics.carrier.payment',
      'production.view',
      'production.milestone.update',
      'production.qc.create',
      'finance.invoice.view',
      'finance.invoice.create',
      'finance.invoice.edit',
      'finance.payment.record',
      'finance.payment.approve',
      'finance.ledger.view',
      'accounting.landed-cost.calculate',
      'accounting.exchange.view',
      'accounting.tax.report',
      'reports.view',
      'reports.export',
      'notifications.manage',
      'documents.upload',
      'documents.download',
      'approvals.view',
      'approvals.action',
      'approvals.delegate',
      'dashboard.view',
    ]);

    // USER: view/create basics
    assign(user, [
      'partners.view',
      'products.view',
      'orders.sales.view',
      'orders.sales.create',
      'orders.purchase.view',
      'inventory.view',
      'inventory.cut',
      'logistics.shipment.view',
      'production.view',
      'finance.invoice.view',
      'finance.ledger.view',
      'reports.view',
      'documents.upload',
      'documents.download',
      'approvals.view',
      'dashboard.view',
    ]);

    await em.flush();
    console.log('✓ Role-permission matrix applied');

    // ═══════════════════════════════════════════════════════
    //  6. Admin User
    // ═══════════════════════════════════════════════════════

    const adminEmail = 'admin@ebusatis.com';
    let adminUser = await em.findOne(User, { email: adminEmail });
    if (!adminUser) {
      adminUser = new User(adminEmail, systemTenant);
      adminUser.passwordHash = await bcrypt.hash('admin123', 10);
      em.persist(adminUser);
      console.log(`✓ Admin user created: ${adminEmail} / admin123`);
    }
    adminUser.isSuperAdmin = true;
    adminUser.isTenantOwner = false;
    if (!adminUser.roles.contains(superAdmin)) {
      adminUser.roles.add(superAdmin);
    }

    await em.flush();
    console.log('✓ AdminSeeder complete');
  }
}
