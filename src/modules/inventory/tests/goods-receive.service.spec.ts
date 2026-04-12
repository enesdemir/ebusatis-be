import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { GoodsReceiveService } from '../services/goods-receive.service';
import { InventoryService } from '../services/inventory.service';
import { GoodsReceiveStatus } from '../entities/goods-receive.entity';
import { DiscrepancyType } from '../entities/goods-receive-line.entity';
import { CreateGoodsReceiveDto } from '../dto/create-goods-receive.dto';
import { ReportDiscrepancyDto } from '../dto/report-discrepancy.dto';
import {
  TenantContextMissingException,
  GoodsReceiveNotFoundException,
  GoodsReceiveLineNotFoundException,
} from '../../../common/errors/app.exceptions';

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };

describe('GoodsReceiveService', () => {
  let service: GoodsReceiveService;
  let inventoryService: { createRoll: jest.Mock };
  let em: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    persist: jest.Mock;
    persistAndFlush: jest.Mock;
    flush: jest.Mock;
    count: jest.Mock;
    getReference: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    inventoryService = { createRoll: jest.fn().mockResolvedValue(undefined) };
    em = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
      getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsReceiveService,
        { provide: EntityManager, useValue: em },
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();

    service = module.get(GoodsReceiveService);
  });

  // ── findOne ──
  describe('findOne', () => {
    it('should throw GoodsReceiveNotFoundException when missing', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        GoodsReceiveNotFoundException,
      );
    });

    it('should return when found', async () => {
      const gr = { id: 'gr-1' };
      em.findOne.mockResolvedValue(gr);
      const result = await service.findOne('gr-1');
      expect(result).toBe(gr);
    });
  });

  // ── create ──
  describe('create', () => {
    const baseDto = {
      supplierId: 'sup-1',
      warehouseId: 'wh-1',
      lines: [
        {
          variantId: 'var-1',
          rolls: [
            { barcode: 'B1', quantity: 50 },
            { barcode: 'B2', quantity: 30 },
          ],
        },
      ],
    } as unknown as CreateGoodsReceiveDto;

    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.create(baseDto, 'user-1')).rejects.toThrow(
        TenantContextMissingException,
      );
    });

    it('should generate a tenant-scoped receive number', async () => {
      em.count.mockResolvedValue(2); // two existing → next is 3
      const created = { id: 'gr-1' };
      em.create.mockReturnValueOnce(created);
      em.create.mockReturnValueOnce({ id: 'grl-1' });

      await service.create(baseDto, 'user-1');

      const grPayload = em.create.mock.calls[0][1] as Record<string, unknown>;
      expect(grPayload.receiveNumber).toMatch(/^GR-\d{4}-0003$/);
      expect(grPayload.status).toBe(GoodsReceiveStatus.COMPLETED);
    });

    it('should create one inventory roll per provided roll', async () => {
      const created = { id: 'gr-1' };
      em.create.mockReturnValueOnce(created);
      em.create.mockReturnValueOnce({ id: 'grl-1' });

      await service.create(baseDto, 'user-1');

      expect(inventoryService.createRoll).toHaveBeenCalledTimes(2);
      expect(inventoryService.createRoll.mock.calls[0][0]).toMatchObject({
        barcode: 'B1',
        quantity: 50,
      });
    });

    it('should sum line totals from rolls', async () => {
      const created = { id: 'gr-1' };
      em.create.mockReturnValueOnce(created);
      em.create.mockImplementationOnce(
        (_entity: unknown, data: object) => data,
      );

      await service.create(baseDto, 'user-1');

      const linePayload = em.create.mock.calls[1][1] as Record<string, unknown>;
      expect(linePayload.receivedRollCount).toBe(2);
      expect(linePayload.totalReceivedQuantity).toBe(80);
    });

    it('should attach optional vehicle and driver fields', async () => {
      const dto = {
        ...baseDto,
        vehiclePlate: '34 ABC 123',
        driverName: 'John',
        driverPhone: '+90...',
        eta: '2026-04-15T10:00:00Z',
      };
      const created = { id: 'gr-1' };
      em.create.mockReturnValueOnce(created);
      em.create.mockReturnValueOnce({ id: 'grl-1' });

      await service.create(dto, 'user-1');

      const grPayload = em.create.mock.calls[0][1] as Record<string, unknown>;
      expect(grPayload.vehiclePlate).toBe('34 ABC 123');
      expect(grPayload.driverName).toBe('John');
      expect(grPayload.driverPhone).toBe('+90...');
      expect(grPayload.eta).toBeInstanceOf(Date);
    });
  });

  // ── reportDiscrepancy ──
  describe('reportDiscrepancy', () => {
    it('should throw when goods receive line is missing', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(
        service.reportDiscrepancy(
          'missing',
          {} as unknown as ReportDiscrepancyDto,
        ),
      ).rejects.toThrow(GoodsReceiveLineNotFoundException);
    });

    it('should set discrepancy fields', async () => {
      const line: {
        id: string;
        discrepancyType: DiscrepancyType;
        discrepancyQuantity?: number;
        discrepancyReason?: string;
        photoEvidenceUrls?: string[];
      } = { id: 'grl-1', discrepancyType: DiscrepancyType.NONE };
      em.findOne.mockResolvedValue(line);

      await service.reportDiscrepancy('grl-1', {
        discrepancyType: DiscrepancyType.DAMAGED,
        discrepancyQuantity: 5,
        discrepancyReason: 'Wet packaging',
        photoEvidenceUrls: ['https://cdn/p1.jpg'],
      } as unknown as ReportDiscrepancyDto);

      expect(line.discrepancyType).toBe(DiscrepancyType.DAMAGED);
      expect(line.discrepancyQuantity).toBe(5);
      expect(line.discrepancyReason).toBe('Wet packaging');
      expect(line.photoEvidenceUrls).toEqual(['https://cdn/p1.jpg']);
    });

    it('should clear discrepancy when type is NONE', async () => {
      const line: {
        id: string;
        discrepancyType: DiscrepancyType;
        discrepancyQuantity?: number;
        discrepancyReason?: string;
        conditionNotes?: string;
        photoEvidenceUrls?: string[];
      } = {
        id: 'grl-1',
        discrepancyType: DiscrepancyType.DAMAGED,
        discrepancyQuantity: 5,
        discrepancyReason: 'Wet packaging',
        conditionNotes: 'Outer box damaged',
        photoEvidenceUrls: ['https://cdn/p1.jpg'],
      };
      em.findOne.mockResolvedValue(line);

      await service.reportDiscrepancy('grl-1', {
        discrepancyType: DiscrepancyType.NONE,
      } as unknown as ReportDiscrepancyDto);

      expect(line.discrepancyType).toBe(DiscrepancyType.NONE);
      expect(line.discrepancyQuantity).toBeUndefined();
      expect(line.discrepancyReason).toBeUndefined();
      expect(line.conditionNotes).toBeUndefined();
      expect(line.photoEvidenceUrls).toBeUndefined();
    });

    it('should leave existing type untouched when type is omitted', async () => {
      const line: {
        id: string;
        discrepancyType: DiscrepancyType;
        discrepancyReason: string;
      } = {
        id: 'grl-1',
        discrepancyType: DiscrepancyType.DAMAGED,
        discrepancyReason: 'old reason',
      };
      em.findOne.mockResolvedValue(line);

      await service.reportDiscrepancy('grl-1', {
        discrepancyReason: 'new reason',
      } as unknown as ReportDiscrepancyDto);

      expect(line.discrepancyType).toBe(DiscrepancyType.DAMAGED);
      expect(line.discrepancyReason).toBe('new reason');
    });
  });
});
