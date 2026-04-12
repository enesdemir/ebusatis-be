import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { StockValuation } from '../entities/stock-valuation.entity';
import { ExchangeGainLoss } from '../entities/exchange-gain-loss.entity';
import { TaxReport } from '../entities/tax-report.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(StockValuation)
    private readonly valuationRepo: EntityRepository<StockValuation>,
    @InjectRepository(ExchangeGainLoss)
    private readonly fxRepo: EntityRepository<ExchangeGainLoss>,
    @InjectRepository(TaxReport)
    private readonly taxRepo: EntityRepository<TaxReport>,
    private readonly em: EntityManager,
  ) {}

  // Stok Degerleme
  async findValuations(params?: Record<string, any>) {
    const { page = 1, limit = 20 } = params || {};
    const [items, total] = await this.valuationRepo.findAndCount(
      {},
      {
        populate: ['product'],
        orderBy: { periodDate: 'DESC' },
        limit,
        offset: (page - 1) * limit,
      },
    );
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createValuation(data: any) {
    const v = this.valuationRepo.create(data);
    await this.em.persistAndFlush(v);
    return v;
  }

  // Kur Farki
  async findExchangeGainLosses(params?: Record<string, any>) {
    const { page = 1, limit = 20 } = params || {};
    const [items, total] = await this.fxRepo.findAndCount(
      {},
      {
        orderBy: { transactionDate: 'DESC' },
        limit,
        offset: (page - 1) * limit,
      },
    );
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createExchangeGainLoss(data: any) {
    // Kur farki hesapla
    if (data.originalRate && data.settlementRate && data.amount) {
      data.gainLoss = (data.settlementRate - data.originalRate) * data.amount;
    }
    const fx = this.fxRepo.create(data);
    await this.em.persistAndFlush(fx);
    return fx;
  }

  // Vergi Raporlari
  async findTaxReports(params?: Record<string, any>) {
    const { page = 1, limit = 20, type } = params || {};
    const where: any = {};
    if (type) where.type = type;
    const [items, total] = await this.taxRepo.findAndCount(where, {
      orderBy: { period: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTaxReport(data: any) {
    const r = this.taxRepo.create(data);
    await this.em.persistAndFlush(r);
    return r;
  }

  async updateTaxReport(id: string, data: any) {
    const r = await this.taxRepo.findOne({ id });
    if (!r) throw new NotFoundException('Tax report not found');
    Object.assign(r, data);
    await this.em.flush();
    return r;
  }
}
