import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantType } from '../modules/tenants/entities/tenant.entity';
import { Role } from '../modules/iam/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { Permission } from '../modules/iam/entities/permission.entity';

export class AdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // 1. Create System Tenant (Host)
    let systemTenant = await em.findOne(Tenant, { domain: 'admin.localhost' });
    if (!systemTenant) {
      systemTenant = new Tenant('System Admin', 'admin.localhost');
      systemTenant.type = TenantType.SAAS;
      em.persist(systemTenant);
    }

    // 2. Create Super Admin Role
    let adminRole: Role | null = await em.findOne(Role, { name: 'Super Admin', tenant: null }, { populate: ['permissions'] });
    if (!adminRole) {
      adminRole = new Role('Super Admin');
      adminRole.isSystemRole = true;
      em.persist(adminRole);
    }

    // 3. Create All Permissions (Basic Set)
    const permissionsData = [
      { slug: 'tenants.manage', category: 'System', scope: 'PLATFORM' },
      { slug: 'users.manage', category: 'System', scope: 'PLATFORM' },
      { slug: 'roles.manage', category: 'System', scope: 'PLATFORM' },
      { slug: 'dashboard.view', category: 'System', scope: 'PLATFORM' },
      // Example Tenant Permissions
      { slug: 'orders.view', category: 'Sales', scope: 'TENANT' },
      { slug: 'orders.create', category: 'Sales', scope: 'TENANT' },
    ];

    for (const p of permissionsData) {
      let perm = await em.findOne(Permission, { slug: p.slug });
      if (!perm) {
        perm = new Permission(p.slug, p.category, p.scope);
        em.persist(perm);
      } else {
        // Update scope if it changed
        perm.assignableScope = p.scope;
      }
      
      // Only assign PLATFORM permissions to Super Admin for now
      if (p.scope === 'PLATFORM' && !adminRole.permissions.contains(perm)) {
        adminRole.permissions.add(perm);
      }
    }

    // 4. Create Admin User
    const adminEmail = 'admin@ebusatis.com';
    let adminUser = await em.findOne(User, { email: adminEmail });
    if (!adminUser) {
      adminUser = new User(adminEmail, systemTenant);
      adminUser.passwordHash = await bcrypt.hash('admin123', 10);
      adminUser.isSuperAdmin = true;
      adminUser.isTenantOwner = false;
      adminUser.roles.add(adminRole);
      em.persist(adminUser);
      console.log(`Admin user created: ${adminEmail} / admin123`);
    }
  }
}
