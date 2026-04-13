import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { ScheduledReportService } from '../services/scheduled-report.service';
import { ExchangeRateService } from '../../definitions/services/exchange-rate.service';

/**
 * Dev-only manual trigger endpoints for Sprint 17 scheduled tasks.
 * Both weekly + monthly report crons and the TCMB exchange-rate fetch
 * can be fired on demand (QA + smoke tests). Disabled in production.
 */
@Controller('reports/scheduled')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ScheduledReportController {
  constructor(
    private readonly reports: ScheduledReportService,
    private readonly rates: ExchangeRateService,
    private readonly config: ConfigService,
  ) {}

  @Post('weekly/run')
  async runWeekly() {
    this.assertDevOnly();
    await this.reports.weekly();
    return { ok: true };
  }

  @Post('monthly/run')
  async runMonthly() {
    this.assertDevOnly();
    await this.reports.monthly();
    return { ok: true };
  }

  @Post('exchange-rate/fetch')
  async runExchangeRate() {
    this.assertDevOnly();
    await this.rates.fetchDailyTcmbRates();
    return { ok: true };
  }

  @Post('exchange-rate/upsert')
  async upsertRate(
    @Body()
    body: {
      tenantId: string;
      fromCode: string;
      toCode: string;
      rate: number;
      effectiveDate?: string;
    },
  ) {
    const row = await this.rates.upsert(
      body.tenantId,
      body.fromCode,
      body.toCode,
      body.rate,
      body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
    );
    return { ok: !!row, row };
  }

  private assertDevOnly() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('Manual triggers disabled in production');
    }
  }
}
