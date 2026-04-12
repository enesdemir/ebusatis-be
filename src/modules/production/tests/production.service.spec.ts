import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ProductionService } from '../services/production.service';
import {
  SupplierProductionOrder,
  SupplierProductionStatus,
} from '../entities/supplier-production-order.entity';
import {
  ProductionMilestone,
  MilestoneStatus,
} from '../entities/production-milestone.entity';
import { QualityCheck, QCType } from '../entities/quality-check.entity';
import { ProductionMedia } from '../entities/production-media.entity';
import {
  TenantContextMissingException,
  SupplierProductionOrderNotFoundException,
  ProductionMilestoneNotFoundException,
  QualityCheckNotFoundException,
} from '../../../common/errors/app.exceptions';

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };

const buildRepoMock = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn((data: any) => ({ ...data })),
});

describe('ProductionService', () => {
  let service: ProductionService;
  let orderRepo: ReturnType<typeof buildRepoMock>;
  let milestoneRepo: ReturnType<typeof buildRepoMock>;
  let qcRepo: ReturnType<typeof buildRepoMock>;
  let mediaRepo: ReturnType<typeof buildRepoMock>;
  let em: { findOneOrFail: jest.Mock; persist: jest.Mock; persistAndFlush: jest.Mock; flush: jest.Mock; assign: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    orderRepo = buildRepoMock();
    milestoneRepo = buildRepoMock();
    qcRepo = buildRepoMock();
    mediaRepo = buildRepoMock();
    em = {
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn((target: any, source: any) => Object.assign(target, source)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: getRepositoryToken(SupplierProductionOrder), useValue: orderRepo },
        { provide: getRepositoryToken(ProductionMilestone), useValue: milestoneRepo },
        { provide: getRepositoryToken(QualityCheck), useValue: qcRepo },
        { provide: getRepositoryToken(ProductionMedia), useValue: mediaRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(ProductionService);
  });

  // ── findAllOrders ──
  describe('findAllOrders', () => {
    it('should apply filters and return paginated result', async () => {
      orderRepo.findAndCount.mockResolvedValue([
        [{ id: 'spo-1', productionNumber: 'SPO-2026-0001' }],
        1,
      ]);

      const result = await service.findAllOrders({
        page: 1,
        limit: 20,
        status: SupplierProductionStatus.IN_DYEHOUSE,
        supplierId: 'sup-1',
        purchaseOrderId: 'po-1',
        search: 'SPO',
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(orderRepo.findAndCount).toHaveBeenCalledWith(
        {
          status: SupplierProductionStatus.IN_DYEHOUSE,
          supplier: 'sup-1',
          purchaseOrder: 'po-1',
          productionNumber: { $like: '%SPO%' },
        },
        expect.objectContaining({ limit: 20, offset: 0 }),
      );
    });
  });

  // ── findOrderById ──
  describe('findOrderById', () => {
    it('should return order when found', async () => {
      const order = { id: 'spo-1', productionNumber: 'SPO-2026-0001' };
      orderRepo.findOne.mockResolvedValue(order);
      const result = await service.findOrderById('spo-1');
      expect(result).toBe(order);
    });

    it('should throw SupplierProductionOrderNotFoundException when missing', async () => {
      orderRepo.findOne.mockResolvedValue(null);
      await expect(service.findOrderById('missing')).rejects.toThrow(
        SupplierProductionOrderNotFoundException,
      );
    });
  });

  // ── createOrder ──
  describe('createOrder', () => {
    const dto = {
      productionNumber: 'SPO-2026-0001',
      purchaseOrderId: 'po-1',
      supplierId: 'sup-1',
      plannedQuantity: 100,
    } as any;

    it('should throw TenantContextMissingException without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.createOrder(dto)).rejects.toThrow(TenantContextMissingException);
    });

    it('should create order and seed default milestones from template', async () => {
      const createdOrder = { id: 'spo-1', tenant: tenantStub, ...dto };
      orderRepo.create.mockReturnValue(createdOrder);

      const result = await service.createOrder(dto);

      expect(result).toBe(createdOrder);
      expect(em.persistAndFlush).toHaveBeenCalledWith(createdOrder);
      // 6 standart milestone (DYEHOUSE, WEAVING, FINISHING, QC, PACKAGING, READY_FOR_PICKUP)
      expect(milestoneRepo.create).toHaveBeenCalledTimes(
        ProductionService.DEFAULT_MILESTONE_TEMPLATE.length,
      );
      expect(em.persist).toHaveBeenCalledTimes(
        ProductionService.DEFAULT_MILESTONE_TEMPLATE.length,
      );
      expect(em.flush).toHaveBeenCalled();
    });

    it('should set status to AWAITING_START by default', async () => {
      const createdOrder = { id: 'spo-1' };
      orderRepo.create.mockReturnValue(createdOrder);
      await service.createOrder(dto);
      const createCall = orderRepo.create.mock.calls[0][0] as any;
      expect(createCall.status).toBe(SupplierProductionStatus.AWAITING_START);
    });
  });

  // ── updateOrderStatus ──
  describe('updateOrderStatus', () => {
    it('should set actualStartDate when transitioning to IN_DYEHOUSE', async () => {
      const order: any = {
        id: 'spo-1',
        status: SupplierProductionStatus.AWAITING_START,
        actualStartDate: undefined,
      };
      orderRepo.findOne.mockResolvedValue(order);

      await service.updateOrderStatus('spo-1', SupplierProductionStatus.IN_DYEHOUSE);

      expect(order.status).toBe(SupplierProductionStatus.IN_DYEHOUSE);
      expect(order.actualStartDate).toBeInstanceOf(Date);
    });

    it('should set actualCompletionDate when transitioning to READY_TO_SHIP', async () => {
      const order: any = {
        id: 'spo-1',
        status: SupplierProductionStatus.IN_QC,
        actualCompletionDate: undefined,
      };
      orderRepo.findOne.mockResolvedValue(order);

      await service.updateOrderStatus('spo-1', SupplierProductionStatus.READY_TO_SHIP);

      expect(order.actualCompletionDate).toBeInstanceOf(Date);
    });

    it('should not overwrite actualStartDate if already set', async () => {
      const existing = new Date('2026-01-01');
      const order: any = {
        id: 'spo-1',
        status: SupplierProductionStatus.IN_DYEHOUSE,
        actualStartDate: existing,
      };
      orderRepo.findOne.mockResolvedValue(order);

      await service.updateOrderStatus('spo-1', SupplierProductionStatus.IN_DYEHOUSE);
      expect(order.actualStartDate).toBe(existing);
    });
  });

  // ── updateMilestone ──
  describe('updateMilestone', () => {
    it('should throw ProductionMilestoneNotFoundException when missing', async () => {
      milestoneRepo.findOne.mockResolvedValue(null);
      await expect(service.updateMilestone('missing', {} as any)).rejects.toThrow(
        ProductionMilestoneNotFoundException,
      );
    });

    it('should set startedAt when transitioning to IN_PROGRESS', async () => {
      const ms: any = { id: 'ms-1', startedAt: undefined };
      milestoneRepo.findOne.mockResolvedValue(ms);

      await service.updateMilestone('ms-1', { status: MilestoneStatus.IN_PROGRESS } as any);

      expect(ms.startedAt).toBeInstanceOf(Date);
      expect(ms.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    it('should set completedAt when transitioning to COMPLETED', async () => {
      const ms: any = { id: 'ms-1', completedAt: undefined };
      milestoneRepo.findOne.mockResolvedValue(ms);

      await service.updateMilestone('ms-1', { status: MilestoneStatus.COMPLETED } as any);

      expect(ms.completedAt).toBeInstanceOf(Date);
    });
  });

  // ── reportMilestoneFromSupplier ──
  describe('reportMilestoneFromSupplier', () => {
    it('should update milestone and bump parent order lastSupplierUpdateAt', async () => {
      const parentOrder: any = { id: 'spo-1', lastSupplierUpdateAt: undefined };
      const ms: any = {
        id: 'ms-1',
        productionOrder: parentOrder,
        reportedBySupplierAt: undefined,
      };
      milestoneRepo.findOne.mockResolvedValue(ms);

      await service.reportMilestoneFromSupplier('ms-1', {
        status: MilestoneStatus.COMPLETED,
        mediaUrls: ['https://cdn/photo.jpg'],
        note: 'Done',
      });

      expect(ms.status).toBe(MilestoneStatus.COMPLETED);
      expect(ms.supplierMediaUrls).toEqual(['https://cdn/photo.jpg']);
      expect(ms.note).toBe('Done');
      expect(ms.reportedBySupplierAt).toBeInstanceOf(Date);
      expect(parentOrder.lastSupplierUpdateAt).toBeInstanceOf(Date);
    });

    it('should throw when milestone missing', async () => {
      milestoneRepo.findOne.mockResolvedValue(null);
      await expect(
        service.reportMilestoneFromSupplier('missing', {} as any),
      ).rejects.toThrow(ProductionMilestoneNotFoundException);
    });
  });

  // ── createQC ──
  describe('createQC', () => {
    const dto = {
      productionOrderId: 'spo-1',
      testType: 'Martindale',
    } as any;

    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.createQC(dto)).rejects.toThrow(TenantContextMissingException);
    });

    it('should default qcType to SUPPLIER_PRE_SHIPMENT', async () => {
      const created = { id: 'qc-1' };
      qcRepo.create.mockReturnValue(created);
      await service.createQC(dto);
      const call = qcRepo.create.mock.calls[0][0] as any;
      expect(call.qcType).toBe(QCType.SUPPLIER_PRE_SHIPMENT);
    });
  });

  // ── updateQC ──
  describe('updateQC', () => {
    it('should throw QualityCheckNotFoundException when missing', async () => {
      qcRepo.findOne.mockResolvedValue(null);
      await expect(service.updateQC('missing', {} as any)).rejects.toThrow(
        QualityCheckNotFoundException,
      );
    });

    it('should assign provided fields', async () => {
      const qc: any = { id: 'qc-1', result: 'PENDING' };
      qcRepo.findOne.mockResolvedValue(qc);
      await service.updateQC('qc-1', { result: 'PASSED' } as any);
      expect(qc.result).toBe('PASSED');
    });
  });

  // ── addMedia ──
  describe('addMedia', () => {
    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(
        service.addMedia({
          productionOrderId: 'spo-1',
          fileName: 'a.jpg',
          fileUrl: 'https://cdn/a.jpg',
        } as any),
      ).rejects.toThrow(TenantContextMissingException);
    });

    it('should default uploadedBySupplier to false', async () => {
      const created = { id: 'm-1' };
      mediaRepo.create.mockReturnValue(created);
      await service.addMedia({
        productionOrderId: 'spo-1',
        fileName: 'a.jpg',
        fileUrl: 'https://cdn/a.jpg',
      } as any);
      const call = mediaRepo.create.mock.calls[0][0] as any;
      expect(call.uploadedBySupplier).toBe(false);
    });
  });
});
