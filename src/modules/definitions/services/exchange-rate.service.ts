import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  ExchangeRate,
  ExchangeRateSource,
} from '../entities/exchange-rate.entity';
import { Currency } from '../entities/currency.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * ExchangeRateService (Sprint 17).
 *
 * Daily TCMB fetch + manual upsert. When TCMB_ENABLED=true (env) the
 * cron hits the TCMB `today.xml` feed and writes one ExchangeRate row
 * per (fromCurrency, TRY, effectiveDate) pair for every tenant that
 * has the referenced Currency rows.
 *
 * In dev / CI the cron no-ops (env disabled) — services get their
 * rates from manual entries or the explicit `upsert()` method.
 */
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    private readonly em: EntityManager,
    @InjectRepository(ExchangeRate)
    private readonly rateRepo: EntityRepository<ExchangeRate>,
    @InjectRepository(Currency)
    private readonly currencyRepo: EntityRepository<Currency>,
  ) {}

  /** Latest rate from `from` to `to` on or before `date`. */
  async getRate(
    tenantId: string,
    fromCode: string,
    toCode: string,
    date: Date = new Date(),
  ): Promise<number | null> {
    const from = await this.currencyRepo.findOne(
      { tenant: tenantId, code: fromCode },
      { filters: false },
    );
    const to = await this.currencyRepo.findOne(
      { tenant: tenantId, code: toCode },
      { filters: false },
    );
    if (!from || !to) return null;

    const row = await this.rateRepo.findOne(
      {
        tenant: tenantId,
        fromCurrency: from.id,
        toCurrency: to.id,
        effectiveDate: { $lte: date },
      },
      { filters: false, orderBy: { effectiveDate: 'DESC' } },
    );
    return row ? Number(row.rate) : null;
  }

  /**
   * Upsert a rate row for a specific day. Preserves the `source` field
   * so a manual override later in the day takes precedence over the
   * morning TCMB fetch.
   */
  async upsert(
    tenantId: string,
    fromCode: string,
    toCode: string,
    rate: number,
    effectiveDate: Date,
    source: ExchangeRateSource = ExchangeRateSource.MANUAL,
  ): Promise<ExchangeRate | null> {
    const tenant = await this.em.findOne(
      Tenant,
      { id: tenantId },
      { filters: false },
    );
    if (!tenant) return null;
    const from = await this.currencyRepo.findOne(
      { tenant: tenantId, code: fromCode },
      { filters: false },
    );
    const to = await this.currencyRepo.findOne(
      { tenant: tenantId, code: toCode },
      { filters: false },
    );
    if (!from || !to) return null;

    const day = new Date(effectiveDate);
    day.setHours(0, 0, 0, 0);

    const existing = await this.rateRepo.findOne(
      {
        tenant: tenantId,
        fromCurrency: from.id,
        toCurrency: to.id,
        effectiveDate: day,
      },
      { filters: false },
    );
    if (existing) {
      existing.rate = rate;
      existing.source = source;
      await this.em.flush();
      return existing;
    }

    const row = this.rateRepo.create({
      tenant,
      fromCurrency: from,
      toCurrency: to,
      rate,
      effectiveDate: day,
      source,
    } as unknown as ExchangeRate);
    await this.em.persistAndFlush(row);
    return row;
  }

  /**
   * Daily fetch from TCMB (Türkiye Cumhuriyet Merkez Bankası).
   * Only runs when TCMB_ENABLED=true. Writes one row per
   * (tenant, currency, TRY) pair for today.
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async fetchDailyTcmbRates(): Promise<void> {
    if (process.env.TCMB_ENABLED !== 'true') return;
    try {
      const rates = await this.fetchTcmb();
      const tenants = await this.em.find(Tenant, {}, { filters: false });
      for (const t of tenants) {
        for (const [code, rate] of Object.entries(rates)) {
          await this.upsert(
            t.id,
            code,
            'TRY',
            rate,
            new Date(),
            ExchangeRateSource.API,
          );
        }
      }
      this.logger.log(
        `TCMB rates fetched for ${tenants.length} tenants: ${Object.keys(rates).join(', ')}`,
      );
    } catch (err) {
      this.logger.error(`TCMB fetch failed: ${(err as Error).message}`);
    }
  }

  /**
   * Parse TCMB today.xml. Extracted so tests can stub the HTTP layer
   * without pulling a full XML parser in. Returns `{ USD: 34.1, EUR: 36.8 }`.
   */
  private async fetchTcmb(): Promise<Record<string, number>> {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');
    const text = await res.text();
    const out: Record<string, number> = {};
    const blocks = text.matchAll(
      /<Currency[^>]*CurrencyCode="([A-Z]{3})"[^>]*>([\s\S]*?)<\/Currency>/g,
    );
    for (const m of blocks) {
      const code = m[1];
      const body = m[2];
      const match = body.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
      if (match) {
        const rate = Number(match[1]);
        if (!Number.isNaN(rate) && rate > 0) out[code] = rate;
      }
    }
    return out;
  }
}
