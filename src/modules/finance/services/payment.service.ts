import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Payment, PaymentDirection } from '../entities/payment.entity';
import { PaymentInvoiceMatch } from '../entities/payment-invoice-match.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class PaymentService {
  constructor(private readonly em: EntityManager) {}

  async findAll(query: PaginatedQueryDto & { direction?: PaymentDirection }): Promise<PaginatedResponse<Payment>> {
    const where: FilterQuery<Payment> = {};
    if (query.direction) where.direction = query.direction;
    return QueryBuilderHelper.paginate(this.em, Payment, query, {
      searchFields: ['paymentNumber', 'reference'],
      defaultSortBy: 'paymentDate',
      where,
      populate: ['partner', 'currency', 'method'] as any,
    });
  }

  async findOne(id: string): Promise<Payment> {
    const p = await this.em.findOne(Payment, { id }, {
      populate: ['partner', 'counterparty', 'currency', 'method', 'createdBy', 'matchedInvoices', 'matchedInvoices.invoice'] as any,
    });
    if (!p) throw new NotFoundException(`Ödeme bulunamadı: ${id}`);
    return p;
  }

  async create(data: any, userId: string): Promise<Payment> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const count = await this.em.count(Payment, { tenant: tenantId } as any);
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = this.em.create(Payment, {
      tenant, paymentNumber,
      direction: data.direction,
      partner: this.em.getReference('Partner', data.partnerId),
      counterparty: data.counterpartyId ? this.em.getReference('Counterparty', data.counterpartyId) : undefined,
      amount: data.amount,
      currency: data.currencyId ? this.em.getReference('Currency', data.currencyId) : undefined,
      exchangeRate: data.exchangeRate,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      method: data.methodId ? this.em.getReference('PaymentMethod', data.methodId) : undefined,
      reference: data.reference, bankAccount: data.bankAccount, note: data.note,
      createdBy: this.em.getReference('User', userId),
    } as any);
    this.em.persist(payment);

    // Fatura eşleştirme
    if (data.matchedInvoices?.length) {
      for (const mi of data.matchedInvoices) {
        const invoice = await this.em.findOneOrFail(Invoice, { id: mi.invoiceId });
        const match = this.em.create(PaymentInvoiceMatch, {
          tenant, payment, invoice, matchedAmount: mi.amount,
        } as any);
        this.em.persist(match);

        // Fatura ödenen tutarı güncelle
        invoice.paidAmount = Number(invoice.paidAmount) + mi.amount;
        if (invoice.paidAmount >= Number(invoice.grandTotal)) {
          invoice.status = InvoiceStatus.PAID;
        } else if (invoice.paidAmount > 0) {
          invoice.status = InvoiceStatus.PARTIALLY_PAID;
        }
      }
    }

    await this.em.flush();
    return payment;
  }

  /**
   * Cari hesap ekstresi (Ledger)
   */
  async getLedger(counterpartyId: string, from?: string, to?: string): Promise<any> {
    // Faturalar (borç)
    const invoiceWhere: FilterQuery<Invoice> = { counterparty: counterpartyId, deletedAt: null };
    if (from) invoiceWhere.issueDate = { ...(invoiceWhere.issueDate as any || {}), $gte: new Date(from) };
    if (to) invoiceWhere.issueDate = { ...(invoiceWhere.issueDate as any || {}), $lte: new Date(to) };
    const invoices = await this.em.find(Invoice, invoiceWhere, { orderBy: { issueDate: 'ASC' } });

    // Ödemeler (alacak)
    const paymentWhere: FilterQuery<Payment> = { counterparty: counterpartyId, deletedAt: null };
    const payments = await this.em.find(Payment, paymentWhere, { orderBy: { paymentDate: 'ASC' } });

    // Hareketleri birleştir
    const movements: any[] = [];
    let balance = 0;

    for (const inv of invoices) {
      const amount = Number(inv.grandTotal);
      balance += inv.type === 'SALES' ? amount : -amount;
      movements.push({ date: inv.issueDate, type: 'INVOICE', ref: inv.invoiceNumber, debit: inv.type === 'SALES' ? amount : 0, credit: inv.type !== 'SALES' ? amount : 0, balance });
    }
    for (const pay of payments) {
      const amount = Number(pay.amount);
      balance += pay.direction === 'INCOMING' ? -amount : amount;
      movements.push({ date: pay.paymentDate, type: 'PAYMENT', ref: pay.paymentNumber, debit: pay.direction !== 'INCOMING' ? amount : 0, credit: pay.direction === 'INCOMING' ? amount : 0, balance });
    }

    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { counterpartyId, movements, closingBalance: balance };
  }
}
