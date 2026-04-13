import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { CurrentAccountAgingService } from '../services/current-account-aging.service';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

describe('CurrentAccountAgingService', () => {
  let service: CurrentAccountAgingService;
  let invoiceRepo: { find: jest.Mock };

  beforeEach(async () => {
    invoiceRepo = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrentAccountAgingService,
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
      ],
    }).compile();
    service = module.get<CurrentAccountAgingService>(
      CurrentAccountAgingService,
    );
  });

  const daysAgo = (n: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  it('buckets invoices by days past due', async () => {
    invoiceRepo.find.mockResolvedValue([
      {
        id: 'i1',
        invoiceNumber: 'INV-1',
        grandTotal: 1000,
        paidAmount: 0,
        dueDate: daysAgo(10),
        status: InvoiceStatus.ISSUED,
      },
      {
        id: 'i2',
        invoiceNumber: 'INV-2',
        grandTotal: 2000,
        paidAmount: 500,
        dueDate: daysAgo(45),
        status: InvoiceStatus.PARTIALLY_PAID,
      },
      {
        id: 'i3',
        invoiceNumber: 'INV-3',
        grandTotal: 3000,
        paidAmount: 0,
        dueDate: daysAgo(120),
        status: InvoiceStatus.OVERDUE,
      },
      {
        id: 'i4',
        invoiceNumber: 'INV-4',
        grandTotal: 500,
        paidAmount: 500,
        dueDate: daysAgo(5),
        status: InvoiceStatus.ISSUED,
      },
    ]);

    const report = await service.getAging('partner-1');
    const byKey = Object.fromEntries(report.buckets.map((b) => [b.bucket, b]));
    expect(byKey['0-30'].totalOutstanding).toBe(1000);
    expect(byKey['31-60'].totalOutstanding).toBe(1500);
    expect(byKey['61-90'].totalOutstanding).toBe(0);
    expect(byKey['90+'].totalOutstanding).toBe(3000);
    expect(report.totalOutstanding).toBe(5500);
    expect(report.overdueInvoices.length).toBe(3);
    expect(report.overdueInvoices[0].daysPastDue).toBeGreaterThan(
      report.overdueInvoices[1].daysPastDue,
    );
  });

  it('returns empty buckets for partner with no invoices', async () => {
    invoiceRepo.find.mockResolvedValue([]);
    const report = await service.getAging('partner-x');
    expect(report.totalOutstanding).toBe(0);
    expect(report.buckets.every((b) => b.invoiceCount === 0)).toBe(true);
  });
});
