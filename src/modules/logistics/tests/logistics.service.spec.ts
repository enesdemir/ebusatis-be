import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { LogisticsService } from '../services/logistics.service';
import {
  Shipment,
  ShipmentDirection,
  ShipmentStatus,
} from '../entities/shipment.entity';
import { ShipmentLeg, ShipmentLegType } from '../entities/shipment-leg.entity';
import {
  CarrierPaymentSchedule,
  CarrierPaymentTrigger,
} from '../entities/carrier-payment-schedule.entity';
import { ContainerEvent, ContainerEventType } from '../entities/container-event.entity';
import { CustomsDeclaration } from '../entities/customs-declaration.entity';
import { FreightQuote } from '../entities/freight-quote.entity';
import {
  TenantContextMissingException,
  ShipmentNotFoundException,
  ShipmentOrderReferenceRequiredException,
  ContainerEventNotFoundException,
  FreightQuoteNotFoundException,
  ShipmentLegNotFoundException,
  CarrierPaymentNotFoundException,
} from '../../../common/errors/app.exceptions';

// Default TenantContext mock — assumes a tenant context is active.
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: { getTenantId: jest.fn(() => 'test-tenant-id') },
}));

import { TenantContext } from '../../../common/context/tenant.context';

const tenantStub = { id: 'test-tenant-id' };

const buildRepoMock = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  create: jest.fn((data: any) => ({ ...data })),
});

describe('LogisticsService', () => {
  let service: LogisticsService;
  let shipmentRepo: ReturnType<typeof buildRepoMock>;
  let legRepo: ReturnType<typeof buildRepoMock>;
  let carrierPaymentRepo: ReturnType<typeof buildRepoMock>;
  let eventRepo: ReturnType<typeof buildRepoMock>;
  let customsRepo: ReturnType<typeof buildRepoMock>;
  let quoteRepo: ReturnType<typeof buildRepoMock>;
  let em: {
    findOneOrFail: jest.Mock;
    persist: jest.Mock;
    persistAndFlush: jest.Mock;
    flush: jest.Mock;
    assign: jest.Mock;
    removeAndFlush: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getTenantId as jest.Mock).mockReturnValue('test-tenant-id');

    shipmentRepo = buildRepoMock();
    legRepo = buildRepoMock();
    carrierPaymentRepo = buildRepoMock();
    eventRepo = buildRepoMock();
    customsRepo = buildRepoMock();
    quoteRepo = buildRepoMock();
    em = {
      findOneOrFail: jest.fn().mockResolvedValue(tenantStub),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn((target: any, source: any) => Object.assign(target, source)),
      removeAndFlush: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: getRepositoryToken(Shipment), useValue: shipmentRepo },
        { provide: getRepositoryToken(ShipmentLeg), useValue: legRepo },
        { provide: getRepositoryToken(CarrierPaymentSchedule), useValue: carrierPaymentRepo },
        { provide: getRepositoryToken(ContainerEvent), useValue: eventRepo },
        { provide: getRepositoryToken(CustomsDeclaration), useValue: customsRepo },
        { provide: getRepositoryToken(FreightQuote), useValue: quoteRepo },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(LogisticsService);
  });

  // ── findAllShipments ──
  describe('findAllShipments', () => {
    it('should apply direction, status and order filters', async () => {
      shipmentRepo.findAndCount.mockResolvedValue([
        [{ id: 'sh-1', shipmentNumber: 'SH-2026-0001' }],
        1,
      ]);

      const result = await service.findAllShipments({
        page: 1,
        limit: 20,
        direction: ShipmentDirection.INBOUND,
        status: ShipmentStatus.IN_TRANSIT,
        purchaseOrderId: 'po-1',
        carrierId: 'car-1',
        search: 'SH',
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(shipmentRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: ShipmentDirection.INBOUND,
          status: ShipmentStatus.IN_TRANSIT,
          purchaseOrder: 'po-1',
          carrier: 'car-1',
          $or: expect.any(Array),
        }),
        expect.objectContaining({ limit: 20, offset: 0 }),
      );
    });

    it('should not include $or when search is empty', async () => {
      shipmentRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllShipments({ page: 1, limit: 20 } as any);
      const where = shipmentRepo.findAndCount.mock.calls[0][0] as any;
      expect(where.$or).toBeUndefined();
    });
  });

  // ── findShipmentById ──
  describe('findShipmentById', () => {
    it('should return shipment when found', async () => {
      const shipment = { id: 'sh-1' };
      shipmentRepo.findOne.mockResolvedValue(shipment);
      const result = await service.findShipmentById('sh-1');
      expect(result).toBe(shipment);
    });

    it('should throw ShipmentNotFoundException when missing', async () => {
      shipmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findShipmentById('missing')).rejects.toThrow(
        ShipmentNotFoundException,
      );
    });
  });

  // ── createShipment ──
  describe('createShipment', () => {
    const inboundDto = {
      shipmentNumber: 'SH-2026-0001',
      direction: ShipmentDirection.INBOUND,
      purchaseOrderId: 'po-1',
    } as any;

    const outboundDto = {
      shipmentNumber: 'SH-2026-0002',
      direction: ShipmentDirection.OUTBOUND,
      salesOrderId: 'so-1',
    } as any;

    it('should throw TenantContextMissingException without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.createShipment(inboundDto)).rejects.toThrow(
        TenantContextMissingException,
      );
    });

    it('should require purchaseOrderId for INBOUND direction', async () => {
      const dto = { ...inboundDto, purchaseOrderId: undefined };
      await expect(service.createShipment(dto)).rejects.toThrow(
        ShipmentOrderReferenceRequiredException,
      );
    });

    it('should require salesOrderId for OUTBOUND direction', async () => {
      const dto = { ...outboundDto, salesOrderId: undefined };
      await expect(service.createShipment(dto)).rejects.toThrow(
        ShipmentOrderReferenceRequiredException,
      );
    });

    it('should create INBOUND shipment with default DRAFT status', async () => {
      const created = { id: 'sh-1' };
      shipmentRepo.create.mockReturnValue(created);
      const result = await service.createShipment(inboundDto);
      expect(result).toBe(created);
      const call = shipmentRepo.create.mock.calls[0][0] as any;
      expect(call.direction).toBe(ShipmentDirection.INBOUND);
      expect(call.status).toBe(ShipmentStatus.DRAFT);
      expect(em.persistAndFlush).toHaveBeenCalledWith(created);
    });

    it('should create OUTBOUND shipment when salesOrderId provided', async () => {
      const created = { id: 'sh-2' };
      shipmentRepo.create.mockReturnValue(created);
      const result = await service.createShipment(outboundDto);
      expect(result).toBe(created);
      const call = shipmentRepo.create.mock.calls[0][0] as any;
      expect(call.direction).toBe(ShipmentDirection.OUTBOUND);
    });
  });

  // ── updateShipmentStatus ──
  describe('updateShipmentStatus', () => {
    it('should set actualDeparture when transitioning to IN_TRANSIT', async () => {
      const shipment: any = {
        id: 'sh-1',
        status: ShipmentStatus.CONFIRMED,
        actualDeparture: undefined,
      };
      shipmentRepo.findOne.mockResolvedValue(shipment);

      await service.updateShipmentStatus('sh-1', ShipmentStatus.IN_TRANSIT);

      expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
      expect(shipment.actualDeparture).toBeInstanceOf(Date);
    });

    it('should set actualArrival when transitioning to DELIVERED', async () => {
      const shipment: any = {
        id: 'sh-1',
        status: ShipmentStatus.IN_TRANSIT,
        actualArrival: undefined,
      };
      shipmentRepo.findOne.mockResolvedValue(shipment);

      await service.updateShipmentStatus('sh-1', ShipmentStatus.DELIVERED);

      expect(shipment.actualArrival).toBeInstanceOf(Date);
    });

    it('should not overwrite actualDeparture if already set', async () => {
      const existing = new Date('2026-01-01');
      const shipment: any = {
        id: 'sh-1',
        status: ShipmentStatus.CONFIRMED,
        actualDeparture: existing,
      };
      shipmentRepo.findOne.mockResolvedValue(shipment);

      await service.updateShipmentStatus('sh-1', ShipmentStatus.IN_TRANSIT);
      expect(shipment.actualDeparture).toBe(existing);
    });
  });

  // ── addContainerEvent ──
  describe('addContainerEvent', () => {
    it('should attach event to existing shipment', async () => {
      const shipment: any = { id: 'sh-1', tenant: tenantStub };
      shipmentRepo.findOne.mockResolvedValue(shipment);
      const created = { id: 'evt-1' };
      eventRepo.create.mockReturnValue(created);

      const result = await service.addContainerEvent('sh-1', {
        eventType: ContainerEventType.LOADED_AT_FACTORY,
        eventDate: '2026-04-12T00:00:00Z',
      } as any);

      expect(result).toBe(created);
      const call = eventRepo.create.mock.calls[0][0] as any;
      expect(call.shipment).toBe(shipment);
      expect(call.eventType).toBe(ContainerEventType.LOADED_AT_FACTORY);
      expect(call.eventDate).toBeInstanceOf(Date);
    });
  });

  // ── removeContainerEvent ──
  describe('removeContainerEvent', () => {
    it('should throw when event missing', async () => {
      eventRepo.findOne.mockResolvedValue(null);
      await expect(service.removeContainerEvent('missing')).rejects.toThrow(
        ContainerEventNotFoundException,
      );
    });

    it('should remove existing event', async () => {
      const event: any = { id: 'evt-1' };
      eventRepo.findOne.mockResolvedValue(event);
      await service.removeContainerEvent('evt-1');
      expect(em.removeAndFlush).toHaveBeenCalledWith(event);
    });
  });

  // ── createCustoms ──
  describe('createCustoms', () => {
    const dto = {
      declarationNumber: 'GTD-2026-0001',
      shipmentId: 'sh-1',
    } as any;

    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(service.createCustoms(dto)).rejects.toThrow(
        TenantContextMissingException,
      );
    });

    it('should default zeroed cost components', async () => {
      const created = { id: 'cd-1' };
      customsRepo.create.mockReturnValue(created);
      await service.createCustoms(dto);
      const call = customsRepo.create.mock.calls[0][0] as any;
      expect(call.customsDuty).toBe(0);
      expect(call.customsVat).toBe(0);
      expect(call.brokerFee).toBe(0);
      expect(call.insuranceCost).toBe(0);
      expect(call.totalCost).toBe(0);
    });
  });

  // ── selectQuote ──
  describe('selectQuote', () => {
    it('should throw when quote missing', async () => {
      quoteRepo.findOne.mockResolvedValue(null);
      await expect(service.selectQuote('missing')).rejects.toThrow(
        FreightQuoteNotFoundException,
      );
    });

    it('should mark quote selected and unmark siblings', async () => {
      const shipmentRef = { id: 'sh-1' };
      const quote: any = { id: 'q-1', shipment: shipmentRef, isSelected: false };
      const sibling: any = { id: 'q-2', shipment: shipmentRef, isSelected: true };
      quoteRepo.findOne.mockResolvedValue(quote);
      quoteRepo.find.mockResolvedValue([sibling]);

      const result = await service.selectQuote('q-1');

      expect(result).toBe(quote);
      expect(quote.isSelected).toBe(true);
      expect(sibling.isSelected).toBe(false);
      expect(em.flush).toHaveBeenCalled();
    });
  });

  // ── createQuote ──
  describe('createQuote', () => {
    it('should throw without tenant context', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);
      await expect(
        service.createQuote({ price: 100 } as any),
      ).rejects.toThrow(TenantContextMissingException);
    });

    it('should persist quote with provided fields', async () => {
      const created = { id: 'q-1' };
      quoteRepo.create.mockReturnValue(created);
      const result = await service.createQuote({
        shipmentId: 'sh-1',
        carrierId: 'car-1',
        price: 1500,
        currencyId: 'cur-usd',
        transitDays: 30,
      } as any);
      expect(result).toBe(created);
      expect(em.persistAndFlush).toHaveBeenCalledWith(created);
    });
  });

  // ── Shipment legs ──
  describe('shipment legs', () => {
    it('findLegs throws when shipment is missing', async () => {
      shipmentRepo.findOne.mockResolvedValue(null);
      await expect(service.findLegs('missing')).rejects.toThrow(
        ShipmentNotFoundException,
      );
    });

    it('findLegs returns legs ordered by legNumber', async () => {
      shipmentRepo.findOne.mockResolvedValue({ id: 'sh-1' });
      legRepo.find.mockResolvedValue([{ id: 'leg-1', legNumber: 1 }]);
      const result = await service.findLegs('sh-1');
      expect(result).toHaveLength(1);
      expect(legRepo.find).toHaveBeenCalledWith(
        { shipment: 'sh-1' },
        expect.objectContaining({ orderBy: { legNumber: 'ASC' } }),
      );
    });

    it('findLegById throws when missing', async () => {
      legRepo.findOne.mockResolvedValue(null);
      await expect(service.findLegById('missing')).rejects.toThrow(
        ShipmentLegNotFoundException,
      );
    });

    it('addLeg auto-assigns legNumber when not provided', async () => {
      const shipment: any = { id: 'sh-1', tenant: tenantStub };
      shipmentRepo.findOne.mockResolvedValue(shipment);
      legRepo.count.mockResolvedValue(2); // two existing legs → next is 3
      const created = { id: 'leg-3' };
      legRepo.create.mockReturnValue(created);

      const result = await service.addLeg('sh-1', {
        legType: ShipmentLegType.SEA,
      } as any);

      expect(result).toBe(created);
      const call = legRepo.create.mock.calls[0][0] as any;
      expect(call.legNumber).toBe(3);
      expect(call.legType).toBe(ShipmentLegType.SEA);
      expect(call.freightCost).toBe(0);
      expect(call.storageCost).toBe(0);
      expect(call.otherCosts).toBe(0);
    });

    it('addLeg respects an explicit legNumber', async () => {
      const shipment: any = { id: 'sh-1', tenant: tenantStub };
      shipmentRepo.findOne.mockResolvedValue(shipment);
      const created = { id: 'leg-1' };
      legRepo.create.mockReturnValue(created);

      await service.addLeg('sh-1', {
        legNumber: 5,
        legType: ShipmentLegType.AIR,
        freightCost: 1000,
      } as any);

      const call = legRepo.create.mock.calls[0][0] as any;
      expect(call.legNumber).toBe(5);
      expect(call.freightCost).toBe(1000);
      expect(legRepo.count).not.toHaveBeenCalled();
    });

    it('updateLeg patches only provided fields', async () => {
      const leg: any = {
        id: 'leg-1',
        freightCost: 100,
        storageCost: 50,
        notes: 'old',
      };
      legRepo.findOne.mockResolvedValue(leg);

      await service.updateLeg('leg-1', { freightCost: 200, notes: 'new' } as any);

      expect(leg.freightCost).toBe(200);
      expect(leg.storageCost).toBe(50);
      expect(leg.notes).toBe('new');
    });

    it('removeLeg removes existing leg', async () => {
      const leg: any = { id: 'leg-1' };
      legRepo.findOne.mockResolvedValue(leg);
      await service.removeLeg('leg-1');
      expect(em.removeAndFlush).toHaveBeenCalledWith(leg);
    });
  });

  // ── Carrier payment schedule ──
  describe('carrier payment schedule', () => {
    it('addCarrierPayment auto-assigns installment number', async () => {
      const leg: any = { id: 'leg-1', tenant: tenantStub };
      legRepo.findOne.mockResolvedValue(leg);
      carrierPaymentRepo.count.mockResolvedValue(1); // existing → next is 2
      const created = { id: 'cp-1' };
      carrierPaymentRepo.create.mockReturnValue(created);

      await service.addCarrierPayment('leg-1', {
        trigger: CarrierPaymentTrigger.ON_BOOKING,
        amount: 500,
      } as any);

      const call = carrierPaymentRepo.create.mock.calls[0][0] as any;
      expect(call.installmentNumber).toBe(2);
      expect(call.trigger).toBe(CarrierPaymentTrigger.ON_BOOKING);
      expect(call.amount).toBe(500);
    });

    it('findCarrierPaymentById throws when missing', async () => {
      carrierPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.findCarrierPaymentById('missing')).rejects.toThrow(
        CarrierPaymentNotFoundException,
      );
    });

    it('findCarrierPayments resolves leg first then queries payments', async () => {
      legRepo.findOne.mockResolvedValue({ id: 'leg-1' });
      carrierPaymentRepo.find.mockResolvedValue([
        { id: 'cp-1', installmentNumber: 1 },
      ]);
      const result = await service.findCarrierPayments('leg-1');
      expect(result).toHaveLength(1);
      expect(carrierPaymentRepo.find).toHaveBeenCalledWith(
        { leg: 'leg-1' },
        expect.objectContaining({ orderBy: { installmentNumber: 'ASC' } }),
      );
    });

    it('updateCarrierPayment patches provided fields only', async () => {
      const installment: any = {
        id: 'cp-1',
        amount: 100,
        percentage: 25,
        notes: 'old',
      };
      carrierPaymentRepo.findOne.mockResolvedValue(installment);

      await service.updateCarrierPayment('cp-1', { amount: 200 } as any);

      expect(installment.amount).toBe(200);
      expect(installment.percentage).toBe(25);
      expect(installment.notes).toBe('old');
    });

    it('removeCarrierPayment removes existing installment', async () => {
      const installment: any = { id: 'cp-1' };
      carrierPaymentRepo.findOne.mockResolvedValue(installment);
      await service.removeCarrierPayment('cp-1');
      expect(em.removeAndFlush).toHaveBeenCalledWith(installment);
    });
  });
});
