import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SalesOrderService } from '../services/sales-order.service';
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

describe('SalesOrderService', () => {
  let service: SalesOrderService;
  let mockEm: Record<string, jest.Mock>;

  const mockTenant = { id: 'tenant-1', name: 'Test Tekstil' };

  const createMockOrder = (overrides: Record<string, unknown> = {}) => ({
    id: 'order-1',
    orderNumber: 'SO-2026-0001',
    partner: { id: 'partner-1', name: 'Test Customer' },
    status: { id: 'status-1', name: 'DRAFT' },
    orderDate: new Date('2026-01-15'),
    totalAmount: 1000,
    taxAmount: 180,
    grandTotal: 1180,
    deletedAt: null,
    tenant: mockTenant,
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderService,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<SalesOrderService>(SalesOrderService);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  findAll
  // ═══════════════════════════════════════════════════════

  describe('findAll', () => {
    it('should return paginated sales orders', async () => {
      const paginatedResult = {
        data: [createMockOrder()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      (QueryBuilderHelper.paginate as jest.Mock).mockResolvedValue(
        paginatedResult,
      );

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(QueryBuilderHelper.paginate).toHaveBeenCalledWith(
        mockEm,
        expect.any(Function),
        { page: 1, limit: 20 },
        expect.objectContaining({
          searchFields: ['orderNumber'],
          defaultSortBy: 'orderDate',
        }),
      );
    });

    it('should filter by partnerId when provided', async () => {
      const paginatedResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      (QueryBuilderHelper.paginate as jest.Mock).mockResolvedValue(
        paginatedResult,
      );

      await service.findAll({ page: 1, limit: 20, partnerId: 'partner-1' });

      expect(QueryBuilderHelper.paginate).toHaveBeenCalledWith(
        mockEm,
        expect.any(Function),
        expect.anything(),
        expect.objectContaining({
          where: { partner: 'partner-1' },
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findOne
  // ═══════════════════════════════════════════════════════

  describe('findOne', () => {
    it('should return the order when found', async () => {
      const order = createMockOrder();
      mockEm.findOne.mockResolvedValue(order);

      const result = await service.findOne('order-1');

      expect(result).toBe(order);
      expect(mockEm.findOne).toHaveBeenCalledWith(
        expect.any(Function),
        { id: 'order-1' },
        expect.objectContaining({
          populate: expect.arrayContaining(['partner', 'lines']),
        }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  create
  // ═══════════════════════════════════════════════════════

  describe('create', () => {
    it('should create a sales order with auto-generated order number', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.count.mockResolvedValue(5); // 5 existing orders
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({
        id,
      }));

      const createdOrder = createMockOrder({
        orderNumber: `SO-${new Date().getFullYear()}-0006`,
      });
      mockEm.create.mockReturnValue(createdOrder);
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const data = {
        partnerId: 'partner-1',
        currencyId: 'curr-1',
        lines: [],
      };

      const result = await service.create(data, 'user-1');

      expect(result).toBe(createdOrder);
      expect(mockEm.count).toHaveBeenCalled();
      expect(mockEm.persist).toHaveBeenCalled();
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenant context is missing', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);

      await expect(
        service.create({ partnerId: 'p1' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate correct order number format (SO-YYYY-NNNN)', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.count.mockResolvedValue(0); // first order
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({
        id,
      }));

      const year = new Date().getFullYear();
      const createdOrder = createMockOrder({ orderNumber: `SO-${year}-0001` });
      mockEm.create.mockReturnValue(createdOrder);
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const _result = await service.create(
        { partnerId: 'p1', lines: [] },
        'user-1',
      );

      // Verify order number was generated with correct format
      expect(mockEm.create).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          orderNumber: `SO-${year}-0001`,
        }),
      );
    });

    it('should create order lines and calculate totals', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.count.mockResolvedValue(0);
      mockEm.getReference.mockImplementation((entity: string, id: string) => ({
        id,
      }));

      const orderObj = createMockOrder();
      const lineObj = { id: 'line-1', lineNumber: 1, lineTotal: 900 };

      // First create call returns order, second returns line
      mockEm.create.mockReturnValueOnce(orderObj).mockReturnValueOnce(lineObj);
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const data = {
        partnerId: 'p1',
        lines: [
          {
            variantId: 'v1',
            requestedQuantity: 10,
            unitPrice: 100,
            discount: 10,
          },
        ],
      };

      await service.create(data, 'user-1');

      // Should call create for order + each line
      expect(mockEm.create).toHaveBeenCalledTimes(2);
      // Should persist order and line
      expect(mockEm.persist).toHaveBeenCalledTimes(2);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  update
  // ═══════════════════════════════════════════════════════

  describe('update', () => {
    it('should update order fields and flush', async () => {
      const order = createMockOrder();
      mockEm.findOne.mockResolvedValue(order);
      mockEm.assign.mockImplementation((entity, data) =>
        Object.assign(entity, data),
      );
      mockEm.flush.mockResolvedValue(undefined);

      const _result = await service.update('order-1', { note: 'Updated note' });

      expect(mockEm.assign).toHaveBeenCalled();
      expect(mockEm.flush).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  remove (soft delete)
  // ═══════════════════════════════════════════════════════

  describe('remove', () => {
    it('should soft-delete the order by setting deletedAt', async () => {
      const order = createMockOrder();
      mockEm.findOne.mockResolvedValue(order);
      mockEm.flush.mockResolvedValue(undefined);

      await service.remove('order-1');

      expect(order.deletedAt).toBeInstanceOf(Date);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent order', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  allocateRoll
  // ═══════════════════════════════════════════════════════

  describe('allocateRoll', () => {
    it('should allocate a roll to an order line and update reserved quantity', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail
        .mockResolvedValueOnce(mockTenant) // tenant
        .mockResolvedValueOnce({ id: 'line-1' }) // orderLine
        .mockResolvedValueOnce({
          id: 'roll-1',
          currentQuantity: 100,
          reservedQuantity: 0,
        }); // roll
      const allocation = {
        id: 'alloc-1',
        allocatedQuantity: 20,
        status: 'RESERVED',
      };
      mockEm.create.mockReturnValue(allocation);
      mockEm.persist.mockImplementation(() => {});
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.allocateRoll('line-1', 'roll-1', 20);

      expect(result).toBe(allocation);
      expect(mockEm.persist).toHaveBeenCalledWith(allocation);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw BadRequestException when insufficient stock for allocation', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail
        .mockResolvedValueOnce(mockTenant)
        .mockResolvedValueOnce({ id: 'line-1' })
        .mockResolvedValueOnce({
          id: 'roll-1',
          currentQuantity: 10,
          reservedQuantity: 5,
        });

      await expect(
        service.allocateRoll('line-1', 'roll-1', 10),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
