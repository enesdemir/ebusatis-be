import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { StockValuation } from '../entities/stock-valuation.entity';
import { ExchangeGainLoss } from '../entities/exchange-gain-loss.entity';
import { TaxReport } from '../entities/tax-report.entity';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreateStockValuationDto } from '../dto/create-stock-valuation.dto';
import { CreateExchangeGainLossDto } from '../dto/create-exchange-gain-loss.dto';
import { CreateTaxReportDto } from '../dto/create-tax-report.dto';
import { UpdateTaxReportDto } from '../dto/update-tax-report.dto';

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
  async findValuations(params?: PaginatedQueryDto) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
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

  async createValuation(data: CreateStockValuationDto) {
    const v = this.valuationRepo.create(data as unknown as StockValuation);
    await this.em.persistAndFlush(v);
    return v;
  }

  // Kur Farki
  async findExchangeGainLosses(params?: PaginatedQueryDto) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
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

  async createExchangeGainLoss(data: CreateExchangeGainLossDto) {
    // Kur farki hesapla
    const mutableData: CreateExchangeGainLossDto & { gainLoss?: number } = data;
    if (
      mutableData.originalRate &&
      mutableData.settlementRate &&
      mutableData.amount
    ) {
      mutableData.gainLoss =
        (mutableData.settlementRate - mutableData.originalRate) *
        mutableData.amount;
    }
    const fx = this.fxRepo.create(mutableData as unknown as ExchangeGainLoss);
    await this.em.persistAndFlush(fx);
    return fx;
  }

  // Vergi Raporlari
  async findTaxReports(params?: PaginatedQueryDto & { type?: string }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const where: Record<string, unknown> = {};
    if (params?.type) where.type = params.type;
    const [items, total] = await this.taxRepo.findAndCount(where as never, {
      orderBy: { period: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTaxReport(data: CreateTaxReportDto) {
    const r = this.taxRepo.create(data as unknown as TaxReport);
    await this.em.persistAndFlush(r);
    return r;
  }

  async updateTaxReport(id: string, data: UpdateTaxReportDto) {
    const r = await this.taxRepo.findOne({ id });
    if (!r) throw new EntityNotFoundException('TaxReport', id);
    Object.assign(r, data);
    await this.em.flush();
    return r;
  }
}
