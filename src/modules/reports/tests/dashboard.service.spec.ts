import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import { DashboardService } from '../services/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let em: { count: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    em = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: EntityManager, useValue: em }],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  it('returns empty widgets for unknown group', async () => {
    const res = await service.getKpisForGroup('UNKNOWN');
    expect(res.group).toBe('UNKNOWN');
    expect(res.widgets).toEqual([]);
  });

  it.each([
    'PURCHASING',
    'WAREHOUSE',
    'SALES',
    'FINANCE',
    'PRODUCTION',
    'LOGISTICS',
  ])('returns widgets for %s', async (group) => {
    const res = await service.getKpisForGroup(group);
    expect(res.group).toBe(group);
    expect(Array.isArray(res.widgets)).toBe(true);
    expect(res.widgets.length).toBeGreaterThan(0);
  });

  it('recent activity returns sorted chronological timeline', async () => {
    const now = new Date();
    const prev = new Date(now.getTime() - 60_000);
    em.find.mockImplementation(
      async (entity: unknown, _where: unknown, _opts: unknown) => {
        const name = (entity as { name?: string })?.name ?? '';
        if (name.includes('PurchaseOrder')) {
          return [
            {
              createdAt: prev,
              orderNumber: 'PO-1',
              supplier: { name: 'Supp' },
            },
          ];
        }
        if (name.includes('SalesOrder')) {
          return [
            {
              createdAt: now,
              orderNumber: 'SO-1',
              partner: { name: 'Cust' },
            },
          ];
        }
        return [];
      },
    );
    const activity = await service.getRecentActivity(10);
    expect(activity.length).toBeGreaterThan(0);
    for (let i = 1; i < activity.length; i++) {
      expect(activity[i - 1].at.getTime()).toBeGreaterThanOrEqual(
        activity[i].at.getTime(),
      );
    }
  });
});
