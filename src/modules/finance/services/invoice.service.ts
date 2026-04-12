import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
} from '../entities/invoice.entity';
import { InvoiceLine } from '../entities/invoice-line.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class InvoiceService {
  constructor(private readonly em: EntityManager) {}

  async findAll(
    query: PaginatedQueryDto & { type?: InvoiceType; status?: InvoiceStatus },
  ): Promise<PaginatedResponse<Invoice>> {
    const where: FilterQuery<Invoice> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    return QueryBuilderHelper.paginate(this.em, Invoice, query, {
      searchFields: ['invoiceNumber'],
      defaultSortBy: 'issueDate',
      where,
      populate: ['partner', 'counterparty', 'currency'] as any,
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const inv = await this.em.findOne(
      Invoice,
      { id },
      {
        populate: [
          'partner',
          'counterparty',
          'currency',
          'paymentMethod',
          'createdBy',
          'lines',
          'lines.variant',
          'lines.taxRate',
        ] as any,
      },
    );
    if (!inv) throw new NotFoundException(`Fatura bulunamadı: ${id}`);
    return inv;
  }

  async create(data: any, userId: string): Promise<Invoice> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const prefix = data.type === InvoiceType.PURCHASE ? 'PINV' : 'INV';
    const count = await this.em.count(Invoice, {
      tenant: tenantId,
      type: data.type,
    } as any);
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = this.em.create(Invoice, {
      tenant,
      invoiceNumber,
      type: data.type,
      partner: this.em.getReference('Partner', data.partnerId),
      counterparty: data.counterpartyId
        ? this.em.getReference('Counterparty', data.counterpartyId)
        : undefined,
      currency: data.currencyId
        ? this.em.getReference('Currency', data.currencyId)
        : undefined,
      exchangeRate: data.exchangeRate,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      paymentMethod: data.paymentMethodId
        ? this.em.getReference('PaymentMethod', data.paymentMethodId)
        : undefined,
      note: data.note,
      sourceOrderId: data.sourceOrderId,
      createdBy: this.em.getReference('User', userId),
    } as any);
    this.em.persist(invoice);

    let subtotal = 0;
    const taxTotal = 0;
    if (data.lines?.length) {
      for (const ld of data.lines) {
        const lineTotal =
          ld.quantity * ld.unitPrice * (1 - (ld.discount || 0) / 100);
        subtotal += lineTotal;
        const line = this.em.create(InvoiceLine, {
          tenant,
          invoice,
          description: ld.description || '',
          variant: ld.variantId
            ? this.em.getReference('ProductVariant', ld.variantId)
            : undefined,
          quantity: ld.quantity,
          unitPrice: ld.unitPrice,
          discount: ld.discount || 0,
          taxRate: ld.taxRateId
            ? this.em.getReference('TaxRate', ld.taxRateId)
            : undefined,
          lineTotal,
          sourceOrderLineId: ld.sourceOrderLineId,
        } as any);
        this.em.persist(line);
      }
    }
    invoice.subtotal = subtotal;
    invoice.taxAmount = taxTotal;
    invoice.grandTotal = subtotal + taxTotal - (data.discountAmount || 0);

    await this.em.flush();
    return invoice;
  }

  async remove(id: string): Promise<void> {
    const inv = await this.findOne(id);
    inv.deletedAt = new Date();
    await this.em.flush();
  }
}
