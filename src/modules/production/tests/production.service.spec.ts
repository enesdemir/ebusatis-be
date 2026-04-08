import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { ProductionService } from '../services/production.service';
import { ProductionOrder, ProductionStatus } from '../entities/production-order.entity';
import { ProductionMilestone, MilestoneStatus } from '../entities/production-milestone.entity';
import { QualityCheck } from '../entities/quality-check.entity';
import { ProductionMedia } from '../entities/production-media.entity';
import { BillOfMaterials } from '../entities/bill-of-materials.entity';

describe('ProductionService', () => {
  let service: ProductionService;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockMilestoneRepo: Record<string, jest.Mock>;
  let mockQcRepo: Record<string, jest.Mock>;
  let mockMediaRepo: Record<string, jest.Mock>;
  let mockBomRepo: Record<string, jest.Mock>;
  let mockEm: Record<string, jest.Mock>;

  const createMockOrder = (overrides: Partial<ProductionOrder> = {}): any => ({
    id: 'order-1',
    orderNumber: 'PO-2026-0001',
    status: ProductionStatus.DRAFT,
    plannedQuantity: 1000,
    producedQuantity: 0,
    actualStartDate: undefined,
    actualEndDate: undefined,
    tenant: { id: 'tenant-1' },
    createdAt: new Date('2026-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    mockOrderRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 'new-order-id' })),
    };

    mockMilestoneRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: `ms-${data.code}` })),
    };

    mockQcRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 'new-qc-id' })),
    };

    mockMediaRepo = {
      findOne: jest.fn(),
    };

    mockBomRepo = {
      findAll: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 'new-bom-id' })),
    };

    mockEm = {
      persist: jest.fn(),
      flush: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: getRepositoryToken(ProductionOrder), useValue: mockOrderRepo },
        { provide: getRepositoryToken(ProductionMilestone), useValue: mockMilestoneRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: mockQcRepo },
        { provide: getRepositoryToken(ProductionMedia), useValue: mockMediaRepo },
        { provide: getRepositoryToken(BillOfMaterials), useValue: mockBomRepo },
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  createOrder
  // ═══════════════════════════════════════════════════════

  describe('createOrder', () => {
    it('should create an order and persist it', async () => {
      const orderData = { orderNumber: 'PO-2026-0001', plannedQuantity: 500, tenant: { id: 'tenant-1' } };
      mockOrderRepo.create.mockReturnValue({ ...orderData, id: 'new-order-id', tenant: { id: 'tenant-1' } });
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.createOrder(orderData);

      expect(mockOrderRepo.create).toHaveBeenCalledWith(orderData);
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });

    it('should auto-create 5 default textile milestones', async () => {
      const createdOrder = { id: 'new-order', tenant: { id: 'tenant-1' } };
      mockOrderRepo.create.mockReturnValue(createdOrder);
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      mockEm.flush.mockResolvedValue(undefined);

      await service.createOrder({ orderNumber: 'PO-001' });

      // 5 milestones: IPLIK, DOKUMA, BOYAMA, APRE, QC
      expect(mockMilestoneRepo.create).toHaveBeenCalledTimes(5);
      expect(mockEm.persist).toHaveBeenCalledTimes(5);

      const createdCodes = mockMilestoneRepo.create.mock.calls.map((call) => call[0].code);
      expect(createdCodes).toEqual(['IPLIK', 'DOKUMA', 'BOYAMA', 'APRE', 'QC']);
    });

    it('should assign correct sortOrder to milestones (0-4)', async () => {
      const createdOrder = { id: 'new-order', tenant: { id: 'tenant-1' } };
      mockOrderRepo.create.mockReturnValue(createdOrder);
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      mockEm.flush.mockResolvedValue(undefined);

      await service.createOrder({ orderNumber: 'PO-002' });

      const sortOrders = mockMilestoneRepo.create.mock.calls.map((call) => call[0].sortOrder);
      expect(sortOrders).toEqual([0, 1, 2, 3, 4]);
    });

    it('should link milestones to the created order', async () => {
      const createdOrder = { id: 'linked-order', tenant: { id: 'tenant-1' } };
      mockOrderRepo.create.mockReturnValue(createdOrder);
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      mockEm.flush.mockResolvedValue(undefined);

      await service.createOrder({ orderNumber: 'PO-003' });

      for (const call of mockMilestoneRepo.create.mock.calls) {
        expect(call[0].productionOrder).toBe(createdOrder);
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findOrderById
  // ═══════════════════════════════════════════════════════

  describe('findOrderById', () => {
    it('should return the order with all populated relations', async () => {
      const order = createMockOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOrderById('order-1');

      expect(result).toBe(order);
      expect(mockOrderRepo.findOne).toHaveBeenCalledWith(
        { id: 'order-1' },
        expect.objectContaining({
          populate: expect.arrayContaining(['milestones', 'qualityChecks', 'media']),
        }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOrderById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOrderById('nonexistent')).rejects.toThrow('Production order not found');
    });
  });

  // ═══════════════════════════════════════════════════════
  //  updateOrderStatus
  // ═══════════════════════════════════════════════════════

  describe('updateOrderStatus', () => {
    it('should set actualStartDate when transitioning to IN_PROGRESS', async () => {
      const order = createMockOrder({ status: ProductionStatus.PLANNED, actualStartDate: undefined });
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.updateOrderStatus('order-1', ProductionStatus.IN_PROGRESS);

      expect(result.status).toBe(ProductionStatus.IN_PROGRESS);
      expect(result.actualStartDate).toBeInstanceOf(Date);
    });

    it('should NOT overwrite actualStartDate if already set', async () => {
      const existingDate = new Date('2026-03-01');
      const order = createMockOrder({
        status: ProductionStatus.QC_PENDING,
        actualStartDate: existingDate,
      });
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockEm.flush.mockResolvedValue(undefined);

      await service.updateOrderStatus('order-1', ProductionStatus.IN_PROGRESS);

      expect(order.actualStartDate).toBe(existingDate);
    });

    it('should set actualEndDate when transitioning to COMPLETED', async () => {
      const order = createMockOrder({ status: ProductionStatus.IN_PROGRESS });
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.updateOrderStatus('order-1', ProductionStatus.COMPLETED);

      expect(result.status).toBe(ProductionStatus.COMPLETED);
      expect(result.actualEndDate).toBeInstanceOf(Date);
    });

    it('should not set dates for non-triggering status transitions', async () => {
      const order = createMockOrder({ status: ProductionStatus.DRAFT });
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockEm.flush.mockResolvedValue(undefined);

      await service.updateOrderStatus('order-1', ProductionStatus.CANCELLED);

      expect(order.status).toBe(ProductionStatus.CANCELLED);
      expect(order.actualStartDate).toBeUndefined();
      expect(order.actualEndDate).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  updateMilestone
  // ═══════════════════════════════════════════════════════

  describe('updateMilestone', () => {
    it('should set startedAt when milestone transitions to IN_PROGRESS', async () => {
      const ms = { id: 'ms-1', status: MilestoneStatus.PENDING, startedAt: undefined, completedAt: undefined };
      mockMilestoneRepo.findOne.mockResolvedValue(ms);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.updateMilestone('ms-1', { status: MilestoneStatus.IN_PROGRESS } as any);

      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('should set completedAt when milestone transitions to COMPLETED', async () => {
      const ms = { id: 'ms-2', status: MilestoneStatus.IN_PROGRESS, startedAt: new Date(), completedAt: undefined };
      mockMilestoneRepo.findOne.mockResolvedValue(ms);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.updateMilestone('ms-2', { status: MilestoneStatus.COMPLETED } as any);

      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      mockMilestoneRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMilestone('nonexistent', { status: MilestoneStatus.COMPLETED } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  QC (Quality Check) CRUD
  // ═══════════════════════════════════════════════════════

  describe('createQC', () => {
    it('should create and persist a quality check', async () => {
      const qcData = { testType: 'Martindale', productionOrder: 'order-1' };
      const created = { ...qcData, id: 'new-qc-id' };
      mockQcRepo.create.mockReturnValue(created);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.createQC(qcData);

      expect(result.id).toBe('new-qc-id');
      expect(result.testType).toBe('Martindale');
      expect(mockQcRepo.create).toHaveBeenCalledWith(qcData);
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(created);
    });
  });

  describe('updateQC', () => {
    it('should update an existing QC check', async () => {
      const existingQc = { id: 'qc-1', testType: 'Martindale', result: 'PENDING' };
      mockQcRepo.findOne.mockResolvedValue(existingQc);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.updateQC('qc-1', { result: 'PASSED', measuredValue: '50000' });

      expect(result.result).toBe('PASSED');
      expect(result.measuredValue).toBe('50000');
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when QC check does not exist', async () => {
      mockQcRepo.findOne.mockResolvedValue(null);

      await expect(service.updateQC('nonexistent', {})).rejects.toThrow(NotFoundException);
      await expect(service.updateQC('nonexistent', {})).rejects.toThrow('QC check not found');
    });
  });

  // ═══════════════════════════════════════════════════════
  //  findAllOrders
  // ═══════════════════════════════════════════════════════

  describe('findAllOrders', () => {
    it('should return paginated results with metadata', async () => {
      const orders = [createMockOrder()];
      mockOrderRepo.findAndCount.mockResolvedValue([orders, 1]);

      const result = await service.findAllOrders({ page: 1, limit: 20 });

      expect(result.data).toEqual(orders);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('should filter by status and search term', async () => {
      mockOrderRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllOrders({ page: 1, limit: 10, search: 'PO-2026', status: ProductionStatus.IN_PROGRESS });

      const whereArg = mockOrderRepo.findAndCount.mock.calls[0][0];
      expect(whereArg.status).toBe(ProductionStatus.IN_PROGRESS);
      expect(whereArg.orderNumber).toEqual({ $like: '%PO-2026%' });
    });
  });
});
