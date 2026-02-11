import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Tenant, SubscriptionStatus, TenantType } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AdminReportsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: EntityRepository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: EntityRepository<AuditLog>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Tenant statistics: breakdown by status, type, growth trend.
   */
  async getTenantStats() {
    const allTenants = await this.tenantRepository.findAll({ populate: ['users'] });
    const byStatus = {
      active: allTenants.filter(t => t.subscriptionStatus === SubscriptionStatus.ACTIVE).length,
      trial: allTenants.filter(t => t.subscriptionStatus === SubscriptionStatus.TRIAL).length,
      suspended: allTenants.filter(t => t.subscriptionStatus === SubscriptionStatus.SUSPENDED).length,
    };
    const byType = {
      saas: allTenants.filter(t => t.type === TenantType.SAAS).length,
      onPrem: allTenants.filter(t => t.type === TenantType.ON_PREM_LICENSE).length,
    };
    // Monthly growth for last 6 months
    const monthlyGrowth: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const count = await this.tenantRepository.count({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      } as any);
      monthlyGrowth.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        count,
      });
    }
    // Top tenants by user count
    const topTenants = allTenants
      .map(t => ({
        id: t.id,
        name: t.name,
        domain: t.domain,
        status: t.subscriptionStatus,
        userCount: t.users.count(),
        features: t.features,
        createdAt: t.createdAt,
      }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 10);
    return {
      total: allTenants.length,
      byStatus,
      byType,
      monthlyGrowth,
      topTenants,
    };
  }

  /**
   * System health: uptime metrics, database stats, memory usage.
   */
  async getSystemHealth() {
    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();
    // DB stats
    const totalTenants = await this.tenantRepository.count();
    const totalUsers = await this.userRepository.count();
    const totalAuditLogs = await this.auditLogRepository.count();
    // Recent errors (logins failed could be a proxy — count recent audit logs)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentLoginsCount = await this.auditLogRepository.count({
      action: AuditAction.LOGIN,
      createdAt: { $gte: oneDayAgo },
    } as any);
    return {
      server: {
        uptimeSeconds: Math.floor(uptimeSeconds),
        uptimeFormatted: formatUptime(uptimeSeconds),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external),
        heapUsedPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      database: {
        totalTenants,
        totalUsers,
        totalAuditLogs,
      },
      activity: {
        loginsLast24h: recentLoginsCount,
      },
    };
  }

  /**
   * Usage stats: login frequency, active users trend, action breakdown.
   */
  async getUsageStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Daily login counts
    const dailyLogins: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      const count = await this.auditLogRepository.count({
        action: AuditAction.LOGIN,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      } as any);
      dailyLogins.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }
    // Action breakdown for the period
    const allLogs = await this.auditLogRepository.find(
      { createdAt: { $gte: startDate } } as any,
      { fields: ['action', 'actorId'] },
    );
    const actionBreakdown: Record<string, number> = {};
    for (const log of allLogs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    }
    // Active unique users in the period
    const uniqueActors = new Set(allLogs.map(l => l.actorId));
    return {
      period: { days, from: startDate.toISOString(), to: new Date().toISOString() },
      dailyLogins,
      actionBreakdown,
      uniqueActiveUsers: uniqueActors.size,
      totalActions: allLogs.length,
    };
  }
}

/** Utility: format bytes to human readable */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Utility: format uptime seconds to human readable */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}g`);
  if (hours > 0) parts.push(`${hours}s`);
  parts.push(`${minutes}dk`);
  return parts.join(' ');
}
