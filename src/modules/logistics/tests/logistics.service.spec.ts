import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsService } from '../services/logistics.service';

// Mock repository'ler
const mockPlanRepo = { findAndCount: jest.fn(), findOne: jest.fn(), create: jest.fn() };
const mockEventRepo = { create: jest.fn() };
const mockCustomsRepo = { findAndCount: jest.fn(), create: jest.fn() };
const mockQuoteRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn() };
const mockEm = { persistAndFlush: jest.fn(), flush: jest.fn(), persist: jest.fn() };

// Service'i constructor injection yerine dogrudan olustur
function createService() {
  return new (LogisticsService as any)(mockPlanRepo, mockEventRepo, mockCustomsRepo, mockQuoteRepo, mockEm);
}

describe('LogisticsService', () => {
  let service: LogisticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createService();
  });

  describe('findAllPlans', () => {
    it('should return paginated plans', async () => {
      mockPlanRepo.findAndCount.mockResolvedValue([[{ id: '1', planNumber: 'SP-001' }], 1]);
      const result = await service.findAllPlans({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('createPlan', () => {
    it('should create and persist', async () => {
      mockPlanRepo.create.mockReturnValue({ id: '1', planNumber: 'SP-001' });
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      const result = await service.createPlan({ planNumber: 'SP-001' });
      expect(result.planNumber).toBe('SP-001');
    });
  });

  describe('updatePlanStatus', () => {
    it('should set actualDeparture on IN_TRANSIT', async () => {
      const plan = { id: '1', status: 'CONFIRMED', actualDeparture: null, actualArrival: null, events: [] };
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockEm.flush.mockResolvedValue(undefined);
      await service.updatePlanStatus('1', 'IN_TRANSIT' as any);
      expect(plan.actualDeparture).toBeDefined();
    });

    it('should set actualArrival on DELIVERED', async () => {
      const plan = { id: '1', status: 'AT_CUSTOMS', actualDeparture: new Date(), actualArrival: null, events: [] };
      mockPlanRepo.findOne.mockResolvedValue(plan);
      mockEm.flush.mockResolvedValue(undefined);
      await service.updatePlanStatus('1', 'DELIVERED' as any);
      expect(plan.actualArrival).toBeDefined();
    });
  });

  describe('addEvent', () => {
    it('should create event linked to plan', async () => {
      mockPlanRepo.findOne.mockResolvedValue({ id: '1', tenant: { id: 't1' }, events: [] });
      mockEventRepo.create.mockReturnValue({ id: 'e1', eventType: 'LOADED' });
      mockEm.persistAndFlush.mockResolvedValue(undefined);
      const result = await service.addEvent('1', { eventType: 'LOADED', eventDate: new Date() });
      expect(result.eventType).toBe('LOADED');
    });
  });

  describe('selectQuote', () => {
    it('should select and deselect others', async () => {
      const q1 = { id: 'q1', isSelected: false, shipmentPlan: 'p1' };
      const q2 = { id: 'q2', isSelected: true, shipmentPlan: 'p1' };
      mockQuoteRepo.findOne.mockResolvedValue(q1);
      mockQuoteRepo.find.mockResolvedValue([q2]);
      mockEm.flush.mockResolvedValue(undefined);
      await service.selectQuote('q1');
      expect(q1.isSelected).toBe(true);
      expect(q2.isSelected).toBe(false);
    });
  });
});
