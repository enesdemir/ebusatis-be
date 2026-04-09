import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InventoryService } from '../services/inventory.service';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper } from '../../../common/helpers/query-builder.helper';

// Mock TenantContext
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn() },
}));

// Mock QueryBuilderHelper
jest.mock('../../../common/helpers/query-builder.helper', () => ({
  QueryBuilderHelper: { paginate: jest.fn() },
}));

describe('InventoryService', () => {
  let service: InventoryService;
  let mockEm: Record<string, jest.Mock>;

  const mockTenant = { id: 'tenant-1', name: 'Test Tekstil' };

  const createMockRoll = (overrides: any = {}) => ({
    id: 'roll-1',
    barcode: 'R-0001',
    batchCode: 'BATCH-001',
    initialQuantity: 100,
    currentQuantity: 80,
    reservedQuantity: 10,
    status: 'IN_STOCK',
    variant: { id: 'v1', name: 'Kumas A' },
    warehouse: { id: 'wh-1', name: 'Ana Depo' },
    tenant: mockTenant,
    deletedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    mockEm = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      persistAndFlush: jest.fn(),
      getReference: jest.fn(),
      assign: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  findAll
  // ═══════════════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated inventory items', async () => {
      const paginatedResult = {
        data: [createMockRoll()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      (QueryBuilderHelper.paginate as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(QueryBuilderHelper.paginate).toHaveBeenCalledWith(
        mockEm,
        expect.any(Function),
        { page: 1, limit: 20 },
        expect.objectContaining({
          searchFields: ['barcode', 'batchCode'],
          defaultSortBy: 'receivedAt',
        }),
      );
    });

    it('should apply variant and warehouse filters when provided', async () => {
      const paginatedResult = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      (QueryBuilderHelper.paginate as jest.Mock).mockResolvedValue(paginatedResult);

      await service.findAll({
        page: 1,
        limit: 20,
        variantId: 'v1',
        warehouseId: 'wh-1',
        status: 'IN_STOCK' as any,
      });

      expect(QueryBuilderHelper.paginate).toHaveBeenCalledWith(
        mockEm,
        expect.any(Function),
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            variant: 'v1',
            warehouse: 'wh-1',
            status: 'IN_STOCK',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findOne
  // ═══════════════════════════════════════════════════════

  describe('findOne', () => {
    it('should return the inventory item when found', async () => {
      const roll = createMockRoll();
      mockEm.findOne.mockResolvedValue(roll);

      const result = await service.findOne('roll-1');

      expect(result).toBe(roll);
      expect(mockEm.findOne).toHaveBeenCalledWith(
        expect.any(Function),
        { id: 'roll-1' },
        expect.objectContaining({
          populate: expect.arrayContaining(['variant', 'warehouse', 'transactions']),
        }),
      );
    });

    it('should throw NotFoundException when roll does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  createRoll
  // ═══════════════════════════════════════════════════════

  describe('createRoll', () => {
    it('should create a roll with initial transaction', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({ id }));

      const createdRoll = createMockRoll({ currentQuantity: 50, initialQuantity: 50 });
      const createdTx = { id: 'tx-1', type: 'PURCHASE', quantityChange: 50 };
      mockEm.create
        .mockReturnValueOnce(createdRoll)  // InventoryItem
        .mockReturnValueOnce(createdTx);   // InventoryTransaction
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const data = {
        variantId: 'v1',
        barcode: 'R-NEW',
        quantity: 50,
        batchCode: 'B001',
        warehouseId: 'wh-1',
      };

      const result = await service.createRoll(data, 'user-1');

      expect(result).toBe(createdRoll);
      expect(mockEm.create).toHaveBeenCalledTimes(2); // item + transaction
      expect(mockEm.persist).toHaveBeenCalledTimes(2);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenant context is missing', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);

      await expect(
        service.createRoll({ variantId: 'v1', barcode: 'R-X', quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  cutRoll
  // ═══════════════════════════════════════════════════════

  describe('cutRoll', () => {
    it('should reduce currentQuantity and create SALE_CUT transaction', async () => {
      const roll = createMockRoll({ currentQuantity: 80, reservedQuantity: 0 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({ id }));
      const tx = { id: 'tx-1', type: 'SALE_CUT', quantityChange: -20 };
      mockEm.create.mockReturnValue(tx);
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.cutRoll('roll-1', 20, 'ref-1', 'Test cut', 'user-1');

      expect(result.currentQuantity).toBe(60);
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          type: 'SALE_CUT',
          quantityChange: -20,
          previousQuantity: 80,
          newQuantity: 60,
        }),
      );
    });

    it('should set status to SOLD when quantity reaches zero', async () => {
      const roll = createMockRoll({ currentQuantity: 10, reservedQuantity: 0 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({ id }));
      mockEm.create.mockReturnValue({ id: 'tx-1' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.cutRoll('roll-1', 10);

      expect(result.currentQuantity).toBe(0);
      expect(result.status).toBe('SOLD');
    });

    it('should throw BadRequestException for zero or negative cut amount', async () => {
      const roll = createMockRoll({ currentQuantity: 80, reservedQuantity: 0 });
      mockEm.findOne.mockResolvedValue(roll);

      await expect(service.cutRoll('roll-1', 0)).rejects.toThrow(BadRequestException);
      await expect(service.cutRoll('roll-1', -5)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cut amount exceeds available stock', async () => {
      const roll = createMockRoll({ currentQuantity: 50, reservedQuantity: 40 });
      mockEm.findOne.mockResolvedValue(roll);

      // Available = 50 - 40 = 10, requesting 20
      await expect(service.cutRoll('roll-1', 20)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  markWaste
  // ═══════════════════════════════════════════════════════

  describe('markWaste', () => {
    it('should reduce quantity and create WASTE transaction', async () => {
      const roll = createMockRoll({ currentQuantity: 50 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({ id }));
      mockEm.create.mockReturnValue({ id: 'tx-1', type: 'WASTE' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.markWaste('roll-1', 5, 'Defective fabric', 'user-1');

      expect(result.currentQuantity).toBe(45);
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          type: 'WASTE',
          quantityChange: -5,
        }),
      );
    });

    it('should set status to WASTE when fully wasted', async () => {
      const roll = createMockRoll({ currentQuantity: 5 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.create.mockReturnValue({ id: 'tx-1' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.markWaste('roll-1', 5);

      expect(result.currentQuantity).toBe(0);
      expect(result.status).toBe('WASTE');
    });

    it('should throw BadRequestException when waste exceeds current quantity', async () => {
      const roll = createMockRoll({ currentQuantity: 10 });
      mockEm.findOne.mockResolvedValue(roll);

      await expect(service.markWaste('roll-1', 15)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  adjustStock
  // ═══════════════════════════════════════════════════════

  describe('adjustStock', () => {
    it('should update quantity and create ADJUSTMENT transaction', async () => {
      const roll = createMockRoll({ currentQuantity: 80 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({ id }));
      mockEm.create.mockReturnValue({ id: 'tx-1', type: 'ADJUSTMENT' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.adjustStock('roll-1', 75, 'Count correction', 'user-1');

      expect(result.currentQuantity).toBe(75);
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          type: 'ADJUSTMENT',
          quantityChange: -5, // 75 - 80
          previousQuantity: 80,
          newQuantity: 75,
        }),
      );
    });

    it('should set status to CONSUMED when adjusted to zero', async () => {
      const roll = createMockRoll({ currentQuantity: 10 });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.create.mockReturnValue({ id: 'tx-1' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.adjustStock('roll-1', 0);

      expect(result.currentQuantity).toBe(0);
      expect(result.status).toBe('CONSUMED');
    });

    it('should restore IN_STOCK status when adjusting from non-stock status', async () => {
      const roll = createMockRoll({ currentQuantity: 0, status: 'CONSUMED' });
      mockEm.findOne.mockResolvedValue(roll);
      mockEm.create.mockReturnValue({ id: 'tx-1' });
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.adjustStock('roll-1', 50);

      expect(result.currentQuantity).toBe(50);
      expect(result.status).toBe('IN_STOCK');
    });

    it('should throw BadRequestException for negative quantity', async () => {
      const roll = createMockRoll({ currentQuantity: 80 });
      mockEm.findOne.mockResolvedValue(roll);

      await expect(service.adjustStock('roll-1', -10)).rejects.toThrow(BadRequestException);
    });
  });
});
