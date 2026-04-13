import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { ExcelExportService } from './excel-export.service';
import { DashboardService } from './dashboard.service';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { EmailService } from '../../notifications/services/email.service';

/**
 * ScheduledReportService (Sprint 17).
 *
 * Two fixed cron jobs produce snapshot Excel reports and email them
 * to each tenant's owners:
 *   - Monday 08:00 → weekly operations summary
 *   - First of month 08:00 → monthly KPI pack
 *
 * Both workbooks are assembled from the DashboardService KPI
 * aggregations for the 6 standard groups; the email is skipped when
 * SMTP isn't configured (EmailService stub mode logs + returns true).
 */
@Injectable()
export class ScheduledReportService {
  private readonly logger = new Logger(ScheduledReportService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly excel: ExcelExportService,
    private readonly dashboard: DashboardService,
    private readonly email: EmailService,
  ) {}

  @Cron('0 8 * * 1')
  async weekly(): Promise<void> {
    await this.runForAllTenants('weekly');
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async monthly(): Promise<void> {
    await this.runForAllTenants('monthly');
  }

  private async runForAllTenants(period: 'weekly' | 'monthly'): Promise<void> {
    const tenants = await this.em.find(Tenant, {}, { filters: false });
    for (const tenant of tenants) {
      try {
        await this.runForTenant(tenant, period);
      } catch (err) {
        this.logger.error(
          `scheduled-report ${period} failed for tenant=${tenant.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async runForTenant(
    tenant: Tenant,
    period: 'weekly' | 'monthly',
  ): Promise<void> {
    this.em.setFilterParams('tenant', { tenantId: tenant.id });
    const groups: Array<
      | 'PURCHASING'
      | 'WAREHOUSE'
      | 'SALES'
      | 'FINANCE'
      | 'PRODUCTION'
      | 'LOGISTICS'
    > = [
      'PURCHASING',
      'WAREHOUSE',
      'SALES',
      'FINANCE',
      'PRODUCTION',
      'LOGISTICS',
    ];

    const rows: Array<{
      group: string;
      code: string;
      label: string;
      value: number;
      unit?: string;
    }> = [];
    for (const g of groups) {
      const kpis = await this.dashboard.getKpisForGroup(g);
      for (const w of kpis.widgets) {
        rows.push({ group: g, ...w });
      }
    }

    const buffer = await this.excel.buildSheet(
      `${period.toUpperCase()} KPIs`,
      [
        { header: 'Group', key: 'group', width: 16 },
        { header: 'Code', key: 'code', width: 24 },
        { header: 'Label', key: 'label', width: 40 },
        { header: 'Value', key: 'value', width: 12 },
        { header: 'Unit', key: 'unit', width: 8 },
      ],
      rows,
    );

    const owners = await this.em.find(
      User,
      { tenant: tenant.id, isTenantOwner: true },
      { filters: false },
    );
    const fileName = `${tenant.id}-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    for (const owner of owners) {
      if (!owner.email) continue;
      await this.email.send({
        to: owner.email,
        subject: `EBusatis — ${period} operations snapshot`,
        body: `Attached is the ${period} operations KPI snapshot for ${tenant.name}.`,
        attachments: [
          {
            fileName,
            content: buffer,
            contentType:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      });
    }
    this.logger.log(
      `scheduled-report ${period} emailed to ${owners.length} owner(s) tenant=${tenant.id}`,
    );
  }
}
