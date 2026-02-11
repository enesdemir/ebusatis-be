import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Tenant, SubscriptionStatus } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';

/** Dashboard KPI metrics shape */
export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeUsersLast7Days: number;
  newTenantsLast30Days: number;
}

/** Recent tenant summary */
export interface RecentTenantSummary {
  id: string;
  name: string;
  domain: string;
  subscriptionStatus: string;
  type: string;
  userCount: number;
  createdAt: Date;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: EntityRepository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: EntityRepository<AuditLog>,
  ) {}

  /**
   * Computes platform-wide KPI dashboard statistics.
   */
  async getStats(): Promise<DashboardStats> {
    const allTenants = await this.tenantRepository.findAll();
    const activeTenants = allTenants.filter(
      t => t.subscriptionStatus === SubscriptionStatus.ACTIVE,
    );
    const trialTenants = allTenants.filter(
      t => t.subscriptionStatus === SubscriptionStatus.TRIAL,
    );
    const suspendedTenants = allTenants.filter(
      t => t.subscriptionStatus === SubscriptionStatus.SUSPENDED,
    );
    const totalUsers = await this.userRepository.count({ isSuperAdmin: false });
    // Active users in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsersLast7Days = await this.userRepository.count({
      lastLoginAt: { $gte: sevenDaysAgo },
      isSuperAdmin: false,
    } as any);
    // New tenants in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newTenantsLast30Days = await this.tenantRepository.count({
      createdAt: { $gte: thirtyDaysAgo },
    } as any);
    return {
      totalTenants: allTenants.length,
      activeTenants: activeTenants.length,
      trialTenants: trialTenants.length,
      suspendedTenants: suspendedTenants.length,
      totalUsers,
      activeUsersLast7Days,
      newTenantsLast30Days,
    };
  }

  /**
   * Returns the most recently created tenants with user count.
   */
  async getRecentTenants(limit = 10): Promise<RecentTenantSummary[]> {
    const tenants = await this.tenantRepository.findAll({
      orderBy: { createdAt: 'DESC' },
      limit,
      populate: ['users'],
    });
    return tenants.map(tenant => ({
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      subscriptionStatus: tenant.subscriptionStatus,
      type: tenant.type,
      userCount: tenant.users.count(),
      createdAt: tenant.createdAt,
    }));
  }

  /**
   * Returns the most recent audit log entries for the activity feed.
   */
  async getActivityFeed(limit = 20) {
    return this.auditLogRepository.findAll({
      orderBy: { createdAt: 'DESC' },
      limit,
    });
  }
}
