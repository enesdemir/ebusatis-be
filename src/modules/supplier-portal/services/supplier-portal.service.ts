import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { SupplierProductionOrder } from '../../production/entities/supplier-production-order.entity';
import {
  ProductionMilestone,
  MilestoneStatus,
} from '../../production/entities/production-milestone.entity';
import {
  ProductionMedia,
  MediaType,
} from '../../production/entities/production-media.entity';
import { RFQ, RFQStatus } from '../../sourcing/entities/rfq.entity';
import { RFQResponse } from '../../sourcing/entities/rfq-response.entity';

export interface SupplierScope {
  partnerId: string;
  tenantId: string;
}

/**
 * SupplierPortalService (Sprint 11).
 *
 * Read + write operations a supplier can perform without a full User
 * row. Every query is scoped to `scope.partnerId` + `scope.tenantId`
 * so a token leak for Supplier A can never see Supplier B's data.
 *
 * Tenant filter is bypassed (`filters: false`) and scoping is done
 * manually — the supplier request never has a user session.
 */
@Injectable()
export class SupplierPortalService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: EntityRepository<PurchaseOrder>,
    @InjectRepository(SupplierProductionOrder)
    private readonly spoRepo: EntityRepository<SupplierProductionOrder>,
    @InjectRepository(ProductionMilestone)
    private readonly milestoneRepo: EntityRepository<ProductionMilestone>,
    @InjectRepository(ProductionMedia)
    private readonly mediaRepo: EntityRepository<ProductionMedia>,
    @InjectRepository(RFQ)
    private readonly rfqRepo: EntityRepository<RFQ>,
    @InjectRepository(RFQResponse)
    private readonly responseRepo: EntityRepository<RFQResponse>,
  ) {}

  async listPurchaseOrders(scope: SupplierScope): Promise<PurchaseOrder[]> {
    return this.poRepo.find(
      { supplier: scope.partnerId, tenant: scope.tenantId },
      {
        populate: ['lines', 'lines.variant'] as never[],
        orderBy: { createdAt: 'DESC' },
        filters: false,
      },
    );
  }

  async getProductionOrder(
    scope: SupplierScope,
    spoId: string,
  ): Promise<SupplierProductionOrder> {
    const spo = await this.spoRepo.findOne(
      { id: spoId, supplier: scope.partnerId, tenant: scope.tenantId },
      {
        populate: ['milestones', 'media', 'purchaseOrder'] as never[],
        filters: false,
      },
    );
    if (!spo) throw new NotFoundException(`SupplierProductionOrder ${spoId}`);
    return spo;
  }

  async updateMilestone(
    scope: SupplierScope,
    milestoneId: string,
    data: {
      status?: MilestoneStatus;
      note?: string;
      supplierMediaUrls?: string[];
    },
  ): Promise<ProductionMilestone> {
    const milestone = await this.milestoneRepo.findOne(
      { id: milestoneId, tenant: scope.tenantId },
      { populate: ['productionOrder'] as never[], filters: false },
    );
    if (!milestone) throw new NotFoundException(`Milestone ${milestoneId}`);
    const spoSupplierId = (
      milestone.productionOrder as unknown as { supplier: { id: string } }
    ).supplier.id;
    if (spoSupplierId !== scope.partnerId) {
      throw new NotFoundException(`Milestone ${milestoneId}`);
    }

    if (data.status) {
      milestone.status = data.status;
      if (data.status === MilestoneStatus.IN_PROGRESS && !milestone.startedAt) {
        milestone.startedAt = new Date();
      }
      if (data.status === MilestoneStatus.COMPLETED && !milestone.completedAt) {
        milestone.completedAt = new Date();
      }
    }
    if (data.note !== undefined) milestone.note = data.note;
    if (data.supplierMediaUrls) {
      milestone.supplierMediaUrls = [
        ...(milestone.supplierMediaUrls ?? []),
        ...data.supplierMediaUrls,
      ];
    }
    milestone.reportedBySupplierAt = new Date();
    (
      milestone.productionOrder as unknown as {
        lastSupplierUpdateAt?: Date;
      }
    ).lastSupplierUpdateAt = new Date();

    await this.em.flush();
    return milestone;
  }

  async uploadMedia(
    scope: SupplierScope,
    spoId: string,
    fileUrl: string,
    fileName: string,
    type: MediaType,
    milestoneCode?: string,
    description?: string,
  ): Promise<ProductionMedia> {
    const spo = await this.getProductionOrder(scope, spoId);
    const media = this.mediaRepo.create({
      tenant: spo.tenant,
      productionOrder: spo,
      fileUrl,
      fileName,
      type,
      milestoneCode,
      description,
      uploadedBySupplier: true,
    } as unknown as ProductionMedia);
    await this.em.persistAndFlush(media);
    return media;
  }

  async listOpenRfqs(scope: SupplierScope): Promise<RFQ[]> {
    const rfqs = await this.rfqRepo.find(
      {
        tenant: scope.tenantId,
        status: { $in: [RFQStatus.SENT, RFQStatus.RECEIVED] },
      },
      { filters: false },
    );
    return rfqs.filter((r) => (r.supplierIds ?? []).includes(scope.partnerId));
  }

  async submitQuote(
    scope: SupplierScope,
    rfqId: string,
    data: {
      totalPrice: number;
      currency?: string;
      leadTimeDays?: number;
      validUntil?: Date;
      lineItems?: Array<{
        variantId: string;
        unitPrice: number;
        moq?: number;
        note?: string;
      }>;
      note?: string;
    },
  ): Promise<RFQResponse> {
    const rfq = await this.rfqRepo.findOne(
      { id: rfqId, tenant: scope.tenantId },
      { filters: false },
    );
    if (!rfq) throw new NotFoundException(`RFQ ${rfqId}`);
    if (!(rfq.supplierIds ?? []).includes(scope.partnerId)) {
      throw new NotFoundException(`RFQ ${rfqId}`);
    }

    const resp = this.responseRepo.create({
      tenant: rfq.tenant,
      rfq,
      supplierId: scope.partnerId,
      totalPrice: data.totalPrice,
      currency: data.currency,
      leadTimeDays: data.leadTimeDays,
      validUntil: data.validUntil,
      lineItems: data.lineItems,
      note: data.note,
      receivedAt: new Date(),
    } as unknown as RFQResponse);
    if (rfq.status === RFQStatus.SENT) rfq.status = RFQStatus.RECEIVED;
    await this.em.persistAndFlush(resp);
    return resp;
  }
}
