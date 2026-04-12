import { AccountingService } from '../services/accounting.service';
import { TaxReportStatus } from '../entities/tax-report.entity';
import { CreateExchangeGainLossDto } from '../dto/create-exchange-gain-loss.dto';
import { UpdateTaxReportDto } from '../dto/update-tax-report.dto';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

const mockValRepo = { findAndCount: jest.fn(), create: jest.fn() };
const mockFxRepo = { findAndCount: jest.fn(), create: jest.fn() };
const mockTaxRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};
const mockEm = { persistAndFlush: jest.fn(), flush: jest.fn() };

function createService() {
  return new (AccountingService as unknown as new (
    ...args: unknown[]
  ) => AccountingService)(mockValRepo, mockFxRepo, mockTaxRepo, mockEm);
}

describe('AccountingService', () => {
  let service: AccountingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createService();
  });

  it('findValuations returns paginated', async () => {
    mockValRepo.findAndCount.mockResolvedValue([[{ id: '1' }], 1]);
    const result = await service.findValuations({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
  });

  it('createExchangeGainLoss auto-calculates gainLoss', async () => {
    const data: CreateExchangeGainLossDto = {
      fromCurrency: 'USD',
      toCurrency: 'TRY',
      transactionDate: '2026-01-01',
      originalRate: 30,
      settlementRate: 32,
      amount: 1000,
    };
    mockFxRepo.create.mockImplementation((d: object) => ({ id: '1', ...d }));
    mockEm.persistAndFlush.mockResolvedValue(undefined);
    const result = await service.createExchangeGainLoss(data);
    expect(result.gainLoss).toBe(2000);
  });

  it('findTaxReports filters by type', async () => {
    mockTaxRepo.findAndCount.mockResolvedValue([[], 0]);
    await service.findTaxReports({
      type: 'KDV',
    } as PaginatedQueryDto & { type?: string });
    expect(mockTaxRepo.findAndCount).toHaveBeenCalled();
  });

  it('updateTaxReport updates fields', async () => {
    const r = {
      id: '1',
      status: TaxReportStatus.DRAFT,
      payableTax: 0,
    };
    mockTaxRepo.findOne.mockResolvedValue(r);
    mockEm.flush.mockResolvedValue(undefined);
    await service.updateTaxReport('1', {
      status: TaxReportStatus.CALCULATED,
      payableTax: 5000,
    } as UpdateTaxReportDto);
    expect(r.status).toBe(TaxReportStatus.CALCULATED);
  });

  it('updateTaxReport throws when not found', async () => {
    mockTaxRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateTaxReport('x', {} as UpdateTaxReportDto),
    ).rejects.toThrow();
  });
});
