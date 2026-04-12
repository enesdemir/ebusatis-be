import { Injectable, BadRequestException } from '@nestjs/common';
import {
  EntityNotFoundException,
  TenantContextMissingException,
} from '../../../common/errors/app.exceptions';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderLine } from '../entities/sales-order-line.entity';
import {
  OrderRollAllocation,
  AllocationStatus,
} from '../entities/order-roll-allocation.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';

@Injectable()
export class SalesOrderService {
  constructor(private readonly em: EntityManager) {}

  async findAll(
    query: PaginatedQueryDto & { partnerId?: string },
  ): Promise<PaginatedResponse<SalesOrder>> {
    const where: FilterQuery<SalesOrder> = {};
    if (query.partnerId) where.partner = query.partnerId;
    return QueryBuilderHelper.paginate(this.em, SalesOrder, query, {
      searchFields: ['orderNumber'],
      defaultSortBy: 'orderDate',
      where,
      populate: ['partner', 'status', 'currency', 'assignedTo'] as never[],
    });
  }

  async findOne(id: string): Promise<SalesOrder> {
    const order = await this.em.findOne(
      SalesOrder,
      { id },
      {
        populate: [
          'partner',
          'counterparty',
          'warehouse',
          'currency',
          'status',
          'paymentMethod',
          'deliveryMethod',
          'assignedTo',
          'createdBy',
          'lines',
          'lines.variant',
          'lines.variant.product',
          'lines.taxRate',
          'lines.allocations',
          'lines.allocations.roll',
        ] as never[],
      },
    );
    if (!order) throw new EntityNotFoundException('SalesOrder', id);
    return order;
  }

  async create(data: CreateSalesOrderDto, userId: string): Promise<SalesOrder> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    // Sipariş numarası üret (tenant-scoped)
    const count = await this.em.count(SalesOrder, {
      tenant: tenantId,
    } as FilterQuery<SalesOrder>);
    const orderNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = this.em.create(SalesOrder, {
      tenant,
      orderNumber,
      partner: this.em.getReference('Partner', data.partnerId),
      counterparty: data.counterpartyId
        ? this.em.getReference('Counterparty', data.counterpartyId)
        : undefined,
      warehouse: data.warehouseId
        ? this.em.getReference('Warehouse', data.warehouseId)
        : undefined,
      currency: data.currencyId
        ? this.em.getReference('Currency', data.currencyId)
        : undefined,
      exchangeRate: data.exchangeRate,
      status: data.statusId
        ? this.em.getReference('StatusDefinition', data.statusId)
        : undefined,
      orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate
        ? new Date(data.expectedDeliveryDate)
        : undefined,
      paymentMethod: data.paymentMethodId
        ? this.em.getReference('PaymentMethod', data.paymentMethodId)
        : undefined,
      deliveryMethod: data.deliveryMethodId
        ? this.em.getReference('DeliveryMethod', data.deliveryMethodId)
        : undefined,
      note: data.note,
      internalNote: data.internalNote,
      assignedTo: data.assignedToId
        ? this.em.getReference('User', data.assignedToId)
        : undefined,
      createdBy: this.em.getReference('User', userId),
    } as unknown as SalesOrder);
    this.em.persist(order);

    // Satırları oluştur
    let totalAmount = 0;
    const taxAmount = 0;
    if (data.lines?.length) {
      for (let i = 0; i < data.lines.length; i++) {
        const lineData = data.lines[i];
        const lineTotal =
          lineData.requestedQuantity *
          lineData.unitPrice *
          (1 - (lineData.discount || 0) / 100);
        totalAmount += lineTotal;

        const line = this.em.create(SalesOrderLine, {
          tenant,
          order,
          lineNumber: i + 1,
          variant: this.em.getReference('ProductVariant', lineData.variantId),
          requestedQuantity: lineData.requestedQuantity,
          unitPrice: lineData.unitPrice,
          discount: lineData.discount || 0,
          taxRate: lineData.taxRateId
            ? this.em.getReference('TaxRate', lineData.taxRateId)
            : undefined,
          lineTotal,
          note: lineData.note,
        } as unknown as SalesOrderLine);
        this.em.persist(line);
      }
    }

    order.totalAmount = totalAmount;
    order.taxAmount = taxAmount;
    order.grandTotal = totalAmount + taxAmount - (data.discountAmount || 0);

    await this.em.flush();
    return order;
  }

  async update(id: string, data: UpdateSalesOrderDto): Promise<SalesOrder> {
    const order = await this.findOne(id);
    this.em.assign(order, {
      ...data,
      partner: data.partnerId
        ? this.em.getReference('Partner', data.partnerId)
        : order.partner,
      status: data.statusId
        ? this.em.getReference('StatusDefinition', data.statusId)
        : order.status,
    } as unknown as SalesOrder);
    await this.em.flush();
    return order;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    order.deletedAt = new Date();
    await this.em.flush();
  }

  // ─── Rulo Tahsis (Allocation) ─────────────────────────────

  /**
   * Sipariş satırına top tahsis et.
   * InventoryItem.reservedQuantity artar.
   */
  async allocateRoll(
    orderLineId: string,
    rollId: string,
    quantity: number,
  ): Promise<OrderRollAllocation> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const orderLine = await this.em.findOneOrFail(SalesOrderLine, {
      id: orderLineId,
    });
    const roll = await this.em.findOneOrFail(InventoryItem, { id: rollId });

    const available =
      Number(roll.currentQuantity) - Number(roll.reservedQuantity);
    if (quantity > available) {
      throw new BadRequestException({
        error: 'STOCK_INSUFFICIENT',
        message: 'errors.orders.stock_insufficient',
        metadata: { available, requested: quantity },
      });
    }

    // Rezervasyon
    roll.reservedQuantity = Number(roll.reservedQuantity) + quantity;

    const allocation = this.em.create(OrderRollAllocation, {
      tenant,
      orderLine,
      roll,
      allocatedQuantity: quantity,
      status: AllocationStatus.RESERVED,
    } as unknown as OrderRollAllocation);
    this.em.persist(allocation);

    await this.em.flush();
    return allocation;
  }
}
