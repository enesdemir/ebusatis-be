import { AccountingService } from '../services/accounting.service';

const mockValRepo = { findAndCount: jest.fn(), create: jest.fn() };
const mockFxRepo = { findAndCount: jest.fn(), create: jest.fn() };
const mockTaxRepo = { findAndCount: jest.fn(), findOne: jest.fn(), create: jest.fn() };
const mockEm = { persistAndFlush: jest.fn(), flush: jest.fn() };

function createService() {
  return new (AccountingService as any)(mockValRepo, mockFxRepo, mockTaxRepo, mockEm);
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
    const data = { originalRate: 30, settlementRate: 32, amount: 1000 };
    mockFxRepo.create.mockImplementation((d: any) => ({ id: '1', ...d }));
    mockEm.persistAndFlush.mockResolvedValue(undefined);
    const result = await service.createExchangeGainLoss(data);
    expect(result.gainLoss).toBe(2000);
  });

  it('findTaxReports filters by type', async () => {
    mockTaxRepo.findAndCount.mockResolvedValue([[], 0]);
    await service.findTaxReports({ type: 'KDV' });
    expect(mockTaxRepo.findAndCount).toHaveBeenCalled();
  });

  it('updateTaxReport updates fields', async () => {
    const r = { id: '1', status: 'DRAFT', payableTax: 0 };
    mockTaxRepo.findOne.mockResolvedValue(r);
    mockEm.flush.mockResolvedValue(undefined);
    await service.updateTaxReport('1', { status: 'CALCULATED', payableTax: 5000 });
    expect(r.status).toBe('CALCULATED');
  });

  it('updateTaxReport throws when not found', async () => {
    mockTaxRepo.findOne.mockResolvedValue(null);
    await expect(service.updateTaxReport('x', {})).rejects.toThrow();
  });
});
