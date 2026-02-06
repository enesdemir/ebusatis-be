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
    let adminRole = await em.findOne(Role, { name: 'Super Admin', tenant: null });
    if (!adminRole) {
      adminRole = new Role('Super Admin');
      adminRole.isSystemRole = true;
      em.persist(adminRole);
    }

    // 3. Create All Permissions (Basic Set)
    const permissionsData = [
      { slug: 'tenants.manage', category: 'System' },
      { slug: 'users.manage', category: 'System' },
      { slug: 'roles.manage', category: 'System' },
      { slug: 'dashboard.view', category: 'System' },
    ];

    for (const p of permissionsData) {
      let perm = await em.findOne(Permission, { slug: p.slug });
      if (!perm) {
        perm = new Permission(p.slug, p.category);
        em.persist(perm);
      }
      if (!adminRole.permissions.contains(perm)) {
        adminRole.permissions.add(perm);
      }
    }

    // 4. Create Admin User
    const adminEmail = 'admin@ebusatis.com';
    let adminUser = await em.findOne(User, { email: adminEmail });
    if (!adminUser) {
      adminUser = new User(adminEmail, systemTenant);
      adminUser.passwordHash = await bcrypt.hash('admin123', 10);
      adminUser.isTenantOwner = true;
      adminUser.roles.add(adminRole);
      em.persist(adminUser);
      console.log(`Admin user created: ${adminEmail} / admin123`);
    }
  }
}
