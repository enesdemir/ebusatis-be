import { SalesChannelsService } from '../services/sales-channels.service';

const mockChRepo = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
const mockMapRepo = { find: jest.fn(), create: jest.fn() };
const mockOrdRepo = { find: jest.fn() };
const mockEm = { persistAndFlush: jest.fn(), flush: jest.fn() };

function createService() {
  return new (SalesChannelsService as any)(mockChRepo, mockMapRepo, mockOrdRepo, mockEm);
}

describe('SalesChannelsService', () => {
  let service: SalesChannelsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createService();
  });

  it('findAllChannels returns all', async () => {
    mockChRepo.findAll.mockResolvedValue([{ id: '1', name: 'Trendyol' }]);
    const result = await service.findAllChannels();
    expect(result).toHaveLength(1);
  });

  it('createChannel persists', async () => {
    mockChRepo.create.mockReturnValue({ id: '1', name: 'Shopify' });
    mockEm.persistAndFlush.mockResolvedValue(undefined);
    const result = await service.createChannel({ name: 'Shopify' });
    expect(result.name).toBe('Shopify');
  });

  it('updateChannel updates fields', async () => {
    const ch = { id: '1', name: 'Old', isActive: true, productMappings: [] };
    mockChRepo.findOne.mockResolvedValue(ch);
    mockEm.flush.mockResolvedValue(undefined);
    await service.updateChannel('1', { isActive: false });
    expect(ch.isActive).toBe(false);
  });

  it('findMappings returns for channel', async () => {
    mockMapRepo.find.mockResolvedValue([{ id: 'm1' }]);
    const result = await service.findMappings('ch1');
    expect(result).toHaveLength(1);
  });

  it('findChannelOrders returns orders', async () => {
    mockOrdRepo.find.mockResolvedValue([{ id: 'o1' }]);
    const result = await service.findChannelOrders('ch1');
    expect(result).toHaveLength(1);
  });
});
