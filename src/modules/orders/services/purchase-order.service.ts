import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrderLine } from '../entities/purchase-order-line.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly em: EntityManager) {}

  async findAll(query: PaginatedQueryDto & { supplierId?: string }): Promise<PaginatedResponse<PurchaseOrder>> {
    const where: FilterQuery<PurchaseOrder> = {};
    if (query.supplierId) where.supplier = query.supplierId;
    return QueryBuilderHelper.paginate(this.em, PurchaseOrder, query, {
      searchFields: ['orderNumber'],
      defaultSortBy: 'createdAt',
      where,
      populate: ['supplier', 'status', 'currency'] as any,
    });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.em.findOne(PurchaseOrder, { id }, {
      populate: ['supplier', 'counterparty', 'currency', 'status', 'createdBy', 'lines', 'lines.variant', 'lines.variant.product', 'lines.taxRate'] as any,
    });
    if (!order) throw new NotFoundException(`Satınalma siparişi bulunamadı: ${id}`);
    return order;
  }

  async create(data: any, userId: string): Promise<PurchaseOrder> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const count = await this.em.count(PurchaseOrder, { tenant: tenantId } as any);
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = this.em.create(PurchaseOrder, {
      tenant,
      orderNumber,
      supplier: this.em.getReference('Partner', data.supplierId),
      counterparty: data.counterpartyId ? this.em.getReference('Counterparty', data.counterpartyId) : undefined,
      currency: data.currencyId ? this.em.getReference('Currency', data.currencyId) : undefined,
      exchangeRate: data.exchangeRate,
      status: data.statusId ? this.em.getReference('StatusDefinition', data.statusId) : undefined,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      containerInfo: data.containerInfo,
      note: data.note,
      createdBy: this.em.getReference('User', userId),
    } as any);
    this.em.persist(order);

    let totalAmount = 0;
    if (data.lines?.length) {
      for (const lineData of data.lines) {
        const lineTotal = lineData.quantity * lineData.unitPrice;
        totalAmount += lineTotal;

        const line = this.em.create(PurchaseOrderLine, {
          tenant,
          order,
          variant: this.em.getReference('ProductVariant', lineData.variantId),
          quantity: lineData.quantity,
          unitPrice: lineData.unitPrice,
          taxRate: lineData.taxRateId ? this.em.getReference('TaxRate', lineData.taxRateId) : undefined,
          lineTotal,
          note: lineData.note,
        } as any);
        this.em.persist(line);
      }
    }

    order.totalAmount = totalAmount;
    order.grandTotal = totalAmount;

    await this.em.flush();
    return order;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    order.deletedAt = new Date();
    await this.em.flush();
  }
}
