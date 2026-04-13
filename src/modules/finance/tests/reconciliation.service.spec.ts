import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { ReconciliationService } from '../services/reconciliation.service';
import { Invoice, InvoiceType } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let invoiceRepo: { find: jest.Mock };
  let paymentRepo: { find: jest.Mock };

  beforeEach(async () => {
    invoiceRepo = { find: jest.fn() };
    paymentRepo = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: getRepositoryToken(Invoice), useValue: invoiceRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
      ],
    }).compile();
    service = module.get<ReconciliationService>(ReconciliationService);
  });

  it('chronological ledger with running balance', async () => {
    invoiceRepo.find.mockResolvedValue([
      {
        id: 'i1',
        invoiceNumber: 'INV-1',
        type: InvoiceType.SALES,
        grandTotal: 1000,
        issueDate: new Date('2026-03-01'),
      },
      {
        id: 'i2',
        invoiceNumber: 'INV-2',
        type: InvoiceType.RETURN_SALES,
        grandTotal: 200,
        issueDate: new Date('2026-03-10'),
      },
    ]);
    paymentRepo.find.mockResolvedValue([
      {
        id: 'p1',
        paymentNumber: 'PAY-1',
        amount: 500,
        paymentDate: new Date('2026-03-05'),
      },
    ]);

    const report = await service.reconcilePartner('partner-1');
    expect(report.transactions.length).toBe(3);
    expect(report.transactions[0].number).toBe('INV-1');
    expect(report.transactions[1].number).toBe('PAY-1');
    expect(report.transactions[2].number).toBe('INV-2');
    expect(report.transactions[2].runningBalance).toBe(300); // 1000 - 500 - 200
    expect(report.invoices.totalIssued).toBe(800); // 1000 debit - 200 credit (RETURN_SALES)
    expect(report.payments.totalAmount).toBe(500);
    expect(report.netBalance).toBe(300);
  });
});
