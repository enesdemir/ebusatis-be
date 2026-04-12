import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InvoiceService } from '../services/invoice.service';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
} from '../entities/invoice.entity';
import { PaymentService } from '../services/payment.service';
import { Payment, PaymentDirection } from '../entities/payment.entity';
import { TenantContext } from '../../../common/context/tenant.context';

// Mock TenantContext for invoice and payment services
jest.mock('../../../common/context/tenant.context', () => ({
  TenantContext: {
    getTenantId: jest.fn(),
  },
}));

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockEm: Record<string, jest.Mock>;

  const mockTenant = { id: 'tenant-1', name: 'Test Tekstil' };

  const createMockInvoice = (
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> => ({
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0001',
    type: InvoiceType.SALES,
    status: InvoiceStatus.DRAFT,
    subtotal: 1000,
    taxAmount: 180,
    grandTotal: 1180,
    paidAmount: 0,
    discountAmount: 0,
    issueDate: new Date('2026-01-15'),
    tenant: mockTenant,
    deletedAt: undefined,
    ...overrides,
  });

  beforeEach(async () => {
    mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn((EntityClass, data) => ({ ...data, id: 'new-inv-id' })),
      persist: jest.fn(),
      flush: jest.fn(),
      findOneOrFail: jest.fn(),
      getReference: jest.fn((entity, id) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceService, { provide: EntityManager, useValue: mockEm }],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  findOne
  // ═══════════════════════════════════════════════════════

  describe('findOne', () => {
    it('should return the invoice with all populated relations', async () => {
      const invoice = createMockInvoice();
      mockEm.findOne.mockResolvedValue(invoice);

      const result = await service.findOne('inv-1');

      expect(result).toBe(invoice);
      expect(mockEm.findOne).toHaveBeenCalledWith(
        Invoice,
        { id: 'inv-1' },
        expect.objectContaining({
          populate: expect.arrayContaining(['partner', 'lines']),
        }),
      );
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
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
    beforeEach(() => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.count.mockResolvedValue(0);
      mockEm.flush.mockResolvedValue(undefined);
    });

    it('should create a sales invoice with auto-generated number', async () => {
      const data = {
        type: InvoiceType.SALES,
        partnerId: 'partner-1',
        lines: [],
      };

      const _result = await service.create(data, 'user-1');

      expect(mockEm.create).toHaveBeenCalledWith(
        Invoice,
        expect.objectContaining({
          tenant: mockTenant,
          type: InvoiceType.SALES,
        }),
      );
      // The invoice number for SALES should start with INV
      const createArgs = mockEm.create.mock.calls[0][1];
      expect(createArgs.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('should create a purchase invoice with PINV prefix', async () => {
      const data = {
        type: InvoiceType.PURCHASE,
        partnerId: 'partner-2',
        lines: [],
      };

      await service.create(data, 'user-1');

      const createArgs = mockEm.create.mock.calls[0][1];
      expect(createArgs.invoiceNumber).toMatch(/^PINV-/);
    });

    it('should calculate subtotal and grandTotal from invoice lines', async () => {
      const data = {
        type: InvoiceType.SALES,
        partnerId: 'partner-1',
        lines: [
          { description: 'Item 1', quantity: 10, unitPrice: 100, discount: 0 },
          { description: 'Item 2', quantity: 5, unitPrice: 200, discount: 10 },
        ],
      };

      // create returns an object we can inspect
      const invoiceObj: {
        tenant: typeof mockTenant;
        subtotal: number;
        taxAmount: number;
        grandTotal: number;
      } = {
        tenant: mockTenant,
        subtotal: 0,
        taxAmount: 0,
        grandTotal: 0,
      };
      mockEm.create
        .mockReturnValueOnce(invoiceObj) // invoice creation
        .mockReturnValue({}); // line creation

      await service.create(data, 'user-1');

      // Item1: 10 * 100 * (1 - 0/100) = 1000
      // Item2: 5 * 200 * (1 - 10/100) = 900
      expect(invoiceObj.subtotal).toBe(1900);
      expect(invoiceObj.grandTotal).toBe(1900); // no tax added in current logic
    });

    it('should throw BadRequestException when TenantContext is missing', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);

      await expect(
        service.create(
          { type: InvoiceType.SALES, partnerId: 'p-1', lines: [] },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should persist invoice lines with correct lineTotal', async () => {
      const data = {
        type: InvoiceType.SALES,
        partnerId: 'partner-1',
        lines: [
          { description: 'Fabric A', quantity: 20, unitPrice: 50, discount: 0 },
        ],
      };

      const invoiceObj: {
        tenant: typeof mockTenant;
        subtotal: number;
        taxAmount: number;
        grandTotal: number;
      } = {
        tenant: mockTenant,
        subtotal: 0,
        taxAmount: 0,
        grandTotal: 0,
      };
      const lineObj = {};
      mockEm.create
        .mockReturnValueOnce(invoiceObj)
        .mockReturnValueOnce(lineObj);
      mockEm.flush.mockResolvedValue(undefined);

      await service.create(data, 'user-1');

      // Second create call is for the line
      const lineCreateArgs = mockEm.create.mock.calls[1][1];
      expect(lineCreateArgs.lineTotal).toBe(1000); // 20 * 50
      expect(lineCreateArgs.quantity).toBe(20);
      expect(lineCreateArgs.unitPrice).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  remove
  // ═══════════════════════════════════════════════════════

  describe('remove', () => {
    it('should soft-delete an invoice by setting deletedAt', async () => {
      const invoice = createMockInvoice();
      mockEm.findOne.mockResolvedValue(invoice);
      mockEm.flush.mockResolvedValue(undefined);

      await service.remove('inv-1');

      expect(invoice.deletedAt).toBeInstanceOf(Date);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent invoice', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

// ═══════════════════════════════════════════════════════════
//  PaymentService
// ═══════════════════════════════════════════════════════════

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockEm: Record<string, jest.Mock>;

  const mockTenant = { id: 'tenant-1', name: 'Test Tekstil' };

  beforeEach(async () => {
    mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn((EntityClass, data) => ({ ...data, id: 'new-pay-id' })),
      persist: jest.fn(),
      flush: jest.fn(),
      findOneOrFail: jest.fn(),
      getReference: jest.fn((entity, id) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService, { provide: EntityManager, useValue: mockEm }],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  //  findOne
  // ═══════════════════════════════════════════════════════

  describe('findOne', () => {
    it('should return the payment with populated relations', async () => {
      const payment = {
        id: 'pay-1',
        paymentNumber: 'PAY-2026-0001',
        amount: 500,
      };
      mockEm.findOne.mockResolvedValue(payment);

      const result = await paymentService.findOne('pay-1');

      expect(result).toBe(payment);
      expect(mockEm.findOne).toHaveBeenCalledWith(
        Payment,
        { id: 'pay-1' },
        expect.objectContaining({
          populate: expect.arrayContaining(['partner', 'matchedInvoices']),
        }),
      );
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(paymentService.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════
  //  create
  // ═══════════════════════════════════════════════════════

  describe('create', () => {
    beforeEach(() => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue('tenant-1');
      mockEm.findOneOrFail.mockResolvedValue(mockTenant);
      mockEm.count.mockResolvedValue(0);
      mockEm.flush.mockResolvedValue(undefined);
    });

    it('should create a payment with auto-generated number', async () => {
      const data = {
        direction: PaymentDirection.INCOMING,
        partnerId: 'partner-1',
        amount: 1000,
      };

      await paymentService.create(data, 'user-1');

      const paymentCreateArgs = mockEm.create.mock.calls[0][1];
      expect(paymentCreateArgs.paymentNumber).toMatch(/^PAY-\d{4}-\d{4}$/);
      expect(paymentCreateArgs.direction).toBe(PaymentDirection.INCOMING);
      expect(paymentCreateArgs.amount).toBe(1000);
    });

    it('should update invoice paidAmount and status when matching invoices', async () => {
      const invoice = {
        id: 'inv-1',
        grandTotal: 1000,
        paidAmount: 0,
        status: InvoiceStatus.ISSUED,
      };
      mockEm.findOneOrFail
        .mockResolvedValueOnce(mockTenant) // tenant lookup
        .mockResolvedValueOnce(invoice); // invoice lookup

      const data = {
        direction: PaymentDirection.INCOMING,
        partnerId: 'partner-1',
        amount: 1000,
        matchedInvoices: [{ invoiceId: 'inv-1', amount: 1000 }],
      };

      await paymentService.create(data, 'user-1');

      expect(invoice.paidAmount).toBe(1000);
      expect(invoice.status).toBe(InvoiceStatus.PAID);
    });

    it('should set invoice to PARTIALLY_PAID when not fully paid', async () => {
      const invoice = {
        id: 'inv-2',
        grandTotal: 2000,
        paidAmount: 0,
        status: InvoiceStatus.ISSUED,
      };
      mockEm.findOneOrFail
        .mockResolvedValueOnce(mockTenant)
        .mockResolvedValueOnce(invoice);

      const data = {
        direction: PaymentDirection.INCOMING,
        partnerId: 'partner-1',
        amount: 500,
        matchedInvoices: [{ invoiceId: 'inv-2', amount: 500 }],
      };

      await paymentService.create(data, 'user-1');

      expect(invoice.paidAmount).toBe(500);
      expect(invoice.status).toBe(InvoiceStatus.PARTIALLY_PAID);
    });

    it('should throw BadRequestException when TenantContext is missing', async () => {
      (TenantContext.getTenantId as jest.Mock).mockReturnValue(undefined);

      await expect(
        paymentService.create(
          {
            direction: PaymentDirection.INCOMING,
            partnerId: 'p-1',
            amount: 100,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  getLedger
  // ═══════════════════════════════════════════════════════

  describe('getLedger', () => {
    it('should combine invoices and payments into movements sorted by date', async () => {
      const invoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          type: 'SALES',
          grandTotal: 1000,
          issueDate: new Date('2026-01-10'),
        },
      ];
      const payments = [
        {
          id: 'pay-1',
          paymentNumber: 'PAY-001',
          direction: 'INCOMING',
          amount: 500,
          paymentDate: new Date('2026-01-20'),
        },
      ];

      mockEm.find
        .mockResolvedValueOnce(invoices) // invoices query
        .mockResolvedValueOnce(payments); // payments query

      const result = await paymentService.getLedger('counterparty-1');

      expect(result.counterpartyId).toBe('counterparty-1');
      expect(result.movements).toHaveLength(2);
      // Invoice first (Jan 10), then Payment (Jan 20)
      expect(result.movements[0].type).toBe('INVOICE');
      expect(result.movements[0].debit).toBe(1000);
      expect(result.movements[1].type).toBe('PAYMENT');
      expect(result.movements[1].credit).toBe(500);
    });

    it('should calculate closing balance correctly (debit - credit)', async () => {
      const invoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          type: 'SALES',
          grandTotal: 2000,
          issueDate: new Date('2026-01-05'),
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-002',
          type: 'PURCHASE',
          grandTotal: 300,
          issueDate: new Date('2026-01-06'),
        },
      ];
      const payments = [
        {
          id: 'pay-1',
          paymentNumber: 'PAY-001',
          direction: 'INCOMING',
          amount: 800,
          paymentDate: new Date('2026-01-15'),
        },
      ];

      mockEm.find
        .mockResolvedValueOnce(invoices)
        .mockResolvedValueOnce(payments);

      const result = await paymentService.getLedger('counterparty-1');

      // SALES +2000, PURCHASE -300, INCOMING -800 => 900
      expect(result.closingBalance).toBe(900);
    });

    it('should return empty movements when no invoices or payments exist', async () => {
      mockEm.find
        .mockResolvedValueOnce([]) // no invoices
        .mockResolvedValueOnce([]); // no payments

      const result = await paymentService.getLedger('counterparty-empty');

      expect(result.movements).toHaveLength(0);
      expect(result.closingBalance).toBe(0);
    });
  });
});
