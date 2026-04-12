import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { LandedCostService } from '../services/landed-cost.service';
import { LandedCostCalculation } from '../entities/landed-cost-calculation.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../../orders/entities/purchase-order-line.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { ShipmentLeg, ShipmentLegType } from '../../logistics/entities/shipment-leg.entity';
import { CustomsDeclaration } from '../../logistics/entities/customs-declaration.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import {
  TenantContextMissingException,
  EntityNotFoundException,
  ShipmentNotFoundException,
  LandedCostCalculationNotFoundException,
  LandedCostPurchaseOrderEmptyException,
} from '../../../common/errors/app.exceptions';

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };
const usdCurrency = { id: 'cur-usd', code: 'USD' };

const buildRepoMock = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  create: jest.fn((data: any) => ({ ...data })),
});

describe('LandedCostService', () => {
  let service: LandedCostService;
  let calcRepo: ReturnType<typeof buildRepoMock>;
  let poRepo: ReturnType<typeof buildRepoMock>;
  let poLineRepo: ReturnType<typeof buildRepoMock>;
  let shipmentRepo: ReturnType<typeof buildRepoMock>;
  let legRepo: ReturnType<typeof buildRepoMock>;
  let customsRepo: ReturnType<typeof buildRepoMock>;
  let currencyRepo: ReturnType<typeof buildRepoMock>;
  let em: {
    findOneOrFail: jest.Mock;
    persistAndFlush: jest.Mock;
    flush: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    calcRepo = buildRepoMock();
    poRepo = buildRepoMock();
    poLineRepo = buildRepoMock();
    shipmentRepo = buildRepoMock();
    legRepo = buildRepoMock();
    customsRepo = buildRepoMock();
    currencyRepo = buildRepoMock();
    em = {
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandedCostService,
        { provide: getRepositoryToken(LandedCostCalculation), useValue: calcRepo },
        { provide: getRepositoryToken(PurchaseOrder), useValue: poRepo },
        { provide: getRepositoryToken(PurchaseOrderLine), useValue: poLineRepo },
        { provide: getRepositoryToken(Shipment), useValue: shipmentRepo },
        { provide: getRepositoryToken(ShipmentLeg), useValue: legRepo },
        { provide: getRepositoryToken(CustomsDeclaration), useValue: customsRepo },
        { provide: getRepositoryToken(Currency), useValue: currencyRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(LandedCostService);
  });

  // ── findAll ──
  describe('findAll', () => {
    it('should apply filters and return paginated result', async () => {
      calcRepo.findAndCount.mockResolvedValue([
        [{ id: 'lc-1' }],
        1,
      ]);
      const result = await service.findAll({
        page: 1,
        limit: 20,
        purchaseOrderId: 'po-1',
        shipmentId: 'sh-1',
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(calcRepo.findAndCount).toHaveBeenCalledWith(
        { purchaseOrder: 'po-1', shipment: 'sh-1' },
        expect.objectContaining({ limit: 20, offset: 0 }),
      );
    });
  });

  // ── findById ──
  describe('findById', () => {
    it('should return when found', async () => {
      const calc = { id: 'lc-1' };
      calcRepo.findOne.mockResolvedValue(calc);
      const result = await service.findById('lc-1');
      expect(result).toBe(calc);
    });

    it('should throw LandedCostCalculationNotFoundException when missing', async () => {
      calcRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        LandedCostCalculationNotFoundException,
      );
    });
  });

  // ── calculate ──
  describe('calculate', () => {
    const dto = { purchaseOrderId: 'po-1' } as any;

    it('should throw TenantContextMissingException without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.calculate(dto)).rejects.toThrow(TenantContextMissingException);
    });

    it('should throw EntityNotFoundException when purchase order is missing', async () => {
      poRepo.findOne.mockResolvedValue(null);
      await expect(service.calculate(dto)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw ShipmentNotFoundException when shipmentId does not resolve', async () => {
      poRepo.findOne.mockResolvedValue({
        id: 'po-1',
        grandTotal: 1000,
        currency: usdCurrency,
      });
      poLineRepo.find.mockResolvedValue([
        { id: 'pol-1', quantity: 1, unitPrice: 1000, variant: { id: 'v' }, order: { id: 'po-1' } },
      ]);
      shipmentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.calculate({ purchaseOrderId: 'po-1', shipmentId: 'missing' } as any),
      ).rejects.toThrow(ShipmentNotFoundException);
    });

    it('should throw when purchase order has no lines', async () => {
      poRepo.findOne.mockResolvedValue({
        id: 'po-1',
        grandTotal: 0,
        currency: usdCurrency,
      });
      poLineRepo.find.mockResolvedValue([]);
      await expect(service.calculate(dto)).rejects.toThrow(
        LandedCostPurchaseOrderEmptyException,
      );
    });

    it('should compute product cost only when no shipment provided', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 50000,
        currency: usdCurrency,
      };
      poRepo.findOne.mockResolvedValue(po);
      poLineRepo.find.mockResolvedValue([
        {
          id: 'pol-1',
          quantity: 100,
          unitPrice: 500,
          variant: { id: 'var-1' },
          order: po,
        },
      ]);
      const created = { id: 'lc-1' };
      calcRepo.create.mockReturnValue(created);

      const result = await service.calculate(dto);

      expect(result).toBe(created);
      const call = calcRepo.create.mock.calls[0][0] as any;
      expect(call.productCost).toBe(50000);
      expect(call.freightCost).toBe(0);
      expect(call.customsDuty).toBe(0);
      expect(call.totalLandedCost).toBe(50000);
      expect(call.lineAllocations).toHaveLength(1);
      expect(call.lineAllocations[0].landedUnitCost).toBe(500);
    });

    it('should aggregate freight, customs and storage from shipment legs and declarations', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 50000,
        currency: usdCurrency,
      };
      const shipment: any = { id: 'sh-1' };
      poRepo.findOne.mockResolvedValue(po);
      shipmentRepo.findOne.mockResolvedValue(shipment);
      poLineRepo.find.mockResolvedValue([
        {
          id: 'pol-1',
          quantity: 100,
          unitPrice: 500,
          variant: { id: 'var-1' },
          order: po,
        },
      ]);
      legRepo.find.mockResolvedValue([
        // International freight (sea) — 8000 USD
        { legType: ShipmentLegType.SEA, freightCost: 8000, storageCost: 0, otherCosts: 0 },
        // Inland leg (port → warehouse) — 1500 USD inland
        { legType: ShipmentLegType.PORT_TO_WAREHOUSE, freightCost: 1500, storageCost: 0, otherCosts: 0 },
        // Storage at intermediate warehouse — 200 USD
        { legType: ShipmentLegType.TRANSIT_STORAGE, freightCost: 0, storageCost: 200, otherCosts: 0 },
      ]);
      customsRepo.find.mockResolvedValue([
        {
          customsDuty: 5000,
          customsVat: 9000,
          brokerFee: 500,
          insuranceCost: 300,
        },
      ]);
      const created = { id: 'lc-1' };
      calcRepo.create.mockReturnValue(created);

      await service.calculate({ purchaseOrderId: 'po-1', shipmentId: 'sh-1' } as any);

      const call = calcRepo.create.mock.calls[0][0] as any;
      expect(call.productCost).toBe(50000);
      expect(call.freightCost).toBe(8000); // sea only
      expect(call.inlandTransportCost).toBe(1500); // port→warehouse
      expect(call.storageCost).toBe(200);
      expect(call.customsDuty).toBe(5000);
      expect(call.customsVat).toBe(9000);
      expect(call.brokerFee).toBe(500);
      expect(call.insuranceCost).toBe(300);
      // 50000 + 8000 + 1500 + 200 + 5000 + 9000 + 500 + 300 = 74500
      expect(call.totalLandedCost).toBe(74500);

      // Single line gets the entire allocation; landedUnitCost = 74500/100 = 745
      expect(call.lineAllocations[0].landedUnitCost).toBe(745);
    });

    it('should distribute costs proportionally to line value', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 10000,
        currency: usdCurrency,
      };
      const shipment: any = { id: 'sh-1' };
      poRepo.findOne.mockResolvedValue(po);
      shipmentRepo.findOne.mockResolvedValue(shipment);
      // Two lines: line A 80 units * 100 = 8000 (80% share), line B 20 units * 100 = 2000 (20% share)
      poLineRepo.find.mockResolvedValue([
        {
          id: 'pol-a',
          quantity: 80,
          unitPrice: 100,
          variant: { id: 'var-a' },
          order: po,
        },
        {
          id: 'pol-b',
          quantity: 20,
          unitPrice: 100,
          variant: { id: 'var-b' },
          order: po,
        },
      ]);
      legRepo.find.mockResolvedValue([
        { legType: ShipmentLegType.SEA, freightCost: 1000, storageCost: 0, otherCosts: 0 },
      ]);
      customsRepo.find.mockResolvedValue([]);
      const created = { id: 'lc-1' };
      calcRepo.create.mockReturnValue(created);

      await service.calculate({ purchaseOrderId: 'po-1', shipmentId: 'sh-1' } as any);

      const call = calcRepo.create.mock.calls[0][0] as any;
      // Total landed = 10000 + 1000 = 11000
      // Line A share = 80% → 8000 product + 800 freight = 8800 → /80 = 110 unit cost
      // Line B share = 20% → 2000 product + 200 freight = 2200 → /20 = 110 unit cost
      // Both lines have the same unit price so the per-unit landed cost is identical.
      expect(call.lineAllocations[0].landedUnitCost).toBe(110);
      expect(call.lineAllocations[1].landedUnitCost).toBe(110);
    });

    it('should apply landed unit cost back to PO lines when applyToLines is true', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 1000,
        currency: usdCurrency,
      };
      const line: any = {
        id: 'pol-1',
        quantity: 10,
        unitPrice: 100,
        variant: { id: 'var-1' },
        order: po,
        landedUnitCost: undefined,
      };
      poRepo.findOne.mockResolvedValue(po);
      poLineRepo.find.mockResolvedValue([line]);
      calcRepo.create.mockReturnValue({ id: 'lc-1' });

      await service.calculate({ purchaseOrderId: 'po-1', applyToLines: true } as any);

      expect(line.landedUnitCost).toBe(100);
      // Two flushes expected: persistAndFlush(calc) + flush() inside applyToLines.
      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(em.flush).toHaveBeenCalled();
    });

    it('should NOT apply landed unit cost when applyToLines is false', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 1000,
        currency: usdCurrency,
      };
      const line: any = {
        id: 'pol-1',
        quantity: 10,
        unitPrice: 100,
        variant: { id: 'var-1' },
        order: po,
        landedUnitCost: undefined,
      };
      poRepo.findOne.mockResolvedValue(po);
      poLineRepo.find.mockResolvedValue([line]);
      calcRepo.create.mockReturnValue({ id: 'lc-1' });

      await service.calculate({ purchaseOrderId: 'po-1', applyToLines: false } as any);

      expect(line.landedUnitCost).toBeUndefined();
    });

    it('should fall back to default currency when PO has none', async () => {
      const po: any = {
        id: 'po-1',
        grandTotal: 100,
        currency: null,
      };
      poRepo.findOne.mockResolvedValue(po);
      poLineRepo.find.mockResolvedValue([
        {
          id: 'pol-1',
          quantity: 1,
          unitPrice: 100,
          variant: { id: 'var-1' },
          order: po,
        },
      ]);
      currencyRepo.findOneOrFail.mockResolvedValue(usdCurrency);
      calcRepo.create.mockReturnValue({ id: 'lc-1' });

      await service.calculate({ purchaseOrderId: 'po-1' } as any);

      expect(currencyRepo.findOneOrFail).toHaveBeenCalledWith({ isDefault: true });
    });
  });
});
