import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  FilterQuery,
} from '@mikro-orm/postgresql';
import { v4 as uuidv4 } from 'uuid';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { RFQResponse } from '../entities/rfq-response.entity';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreateRfqDto, CreateRfqResponseDto } from '../dto';
import {
  PurchaseOrder,
  PurchaseOrderWorkflowStatus,
} from '../../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../../orders/entities/purchase-order-line.entity';

@Injectable()
export class SourcingService {
  constructor(
    @InjectRepository(RFQ) private readonly rfqRepo: EntityRepository<RFQ>,
    @InjectRepository(RFQResponse)
    private readonly responseRepo: EntityRepository<RFQResponse>,
    private readonly em: EntityManager,
  ) {}

  async findAllRFQs(params?: PaginatedQueryDto & { status?: RFQStatus }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const search = params?.search;
    const where: FilterQuery<RFQ> = {};
    if (search)
      (where as Record<string, unknown>).$or = [
        { rfqNumber: { $like: `%${search}%` } },
        { title: { $like: `%${search}%` } },
      ];
    if (params?.status)
      (where as Record<string, unknown>).status = params.status;
    const [items, total] = await this.rfqRepo.findAndCount(where, {
      populate: ['createdBy'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findRFQById(id: string) {
    const rfq = await this.rfqRepo.findOne(
      { id },
      { populate: ['responses', 'createdBy'] },
    );
    if (!rfq) throw new EntityNotFoundException('RFQ', id);
    return rfq;
  }

  async createRFQ(data: CreateRfqDto & { createdBy?: string }) {
    const rfq = this.rfqRepo.create(data as unknown as RFQ);
    await this.em.persistAndFlush(rfq);
    return rfq;
  }

  async updateRFQStatus(id: string, status: RFQStatus) {
    const rfq = await this.findRFQById(id);
    rfq.status = status;
    await this.em.flush();
    return rfq;
  }

  async addResponse(rfqId: string, data: CreateRfqResponseDto) {
    const rfq = await this.findRFQById(rfqId);
    const resp = this.responseRepo.create({
      ...data,
      rfq,
      tenant: rfq.tenant,
      receivedAt: new Date(),
    } as unknown as RFQResponse);
    await this.em.persistAndFlush(resp);
    return resp;
  }

  async selectResponse(id: string) {
    const resp = await this.responseRepo.findOne({ id }, { populate: ['rfq'] });
    if (!resp) throw new EntityNotFoundException('RFQResponse', id);
    const others = await this.responseRepo.find({
      rfq: (resp.rfq as { id: string }).id || resp.rfq,
      isSelected: true,
    } as FilterQuery<RFQResponse>);
    for (const o of others) o.isSelected = false;
    resp.isSelected = true;
    await this.em.flush();
    return resp;
  }

  /**
   * Convert a winning RFQResponse into a PurchaseOrder (Sprint 11).
   *
   * Marks the response as selected, de-selects siblings, closes the
   * parent RFQ, and creates a PO in DRAFT from the response's line
   * items. Each PO line points at the same ProductVariant as the RFQ
   * item and inherits the supplier's unit price from the response.
   */
  async convertRfqToPurchaseOrder(
    responseId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const resp = await this.responseRepo.findOne(
      { id: responseId },
      { populate: ['rfq'] },
    );
    if (!resp) throw new EntityNotFoundException('RFQResponse', responseId);

    const others = await this.responseRepo.find({
      rfq: resp.rfq.id,
      isSelected: true,
    });
    for (const o of others) o.isSelected = false;
    resp.isSelected = true;
    resp.rfq.status = RFQStatus.CLOSED;

    const tenant = resp.tenant;
    const year = new Date().getFullYear();
    const count = await this.em.count(PurchaseOrder, { tenant: tenant.id });
    const orderNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

    const po = this.em.create(PurchaseOrder, {
      tenant,
      orderNumber,
      trackingUuid: uuidv4(),
      workflowStatus: PurchaseOrderWorkflowStatus.DRAFT,
      supplier: this.em.getReference('Partner', resp.supplierId),
      createdBy: this.em.getReference('User', userId),
      note: `Auto-generated from RFQ ${resp.rfq.rfqNumber} (response ${resp.id})`,
    } as unknown as PurchaseOrder);
    this.em.persist(po);

    let totalAmount = 0;
    const items = resp.lineItems ?? [];
    for (const item of items) {
      const lineTotal = (item.moq ?? 1) * item.unitPrice;
      totalAmount += lineTotal;
      const line = this.em.create(PurchaseOrderLine, {
        tenant,
        order: po,
        variant: this.em.getReference('ProductVariant', item.variantId),
        quantity: item.moq ?? 1,
        unitPrice: item.unitPrice,
        lineTotal,
        note: item.note,
      } as unknown as PurchaseOrderLine);
      this.em.persist(line);
    }
    po.totalAmount = totalAmount;
    po.grandTotal = totalAmount;

    await this.em.flush();
    return po;
  }

  // Teklif karsilastirma — bir RFQ'nun tum cevaplarini karsilastir
  async compareResponses(rfqId: string) {
    const rfq = await this.findRFQById(rfqId);
    const responses = await this.responseRepo.find(
      { rfq: rfqId } as FilterQuery<RFQResponse>,
      { orderBy: { totalPrice: 'ASC' } },
    );
    return {
      rfq,
      responses,
      cheapest: responses[0] || null,
      fastest:
        [...responses].sort(
          (a, b) => (a.leadTimeDays || 999) - (b.leadTimeDays || 999),
        )[0] || null,
    };
  }
}
