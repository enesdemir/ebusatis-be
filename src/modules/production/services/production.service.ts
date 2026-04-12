import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { Tenant } from '../../tenants/entities/tenant.entity';
import {
  TenantContextMissingException,
  SupplierProductionOrderNotFoundException,
  ProductionMilestoneNotFoundException,
  QualityCheckNotFoundException,
} from '../../../common/errors/app.exceptions';
import {
  SupplierProductionOrder,
  SupplierProductionStatus,
} from '../entities/supplier-production-order.entity';
import {
  ProductionMilestone,
  MilestoneStatus,
  StandardMilestoneCode,
} from '../entities/production-milestone.entity';
import { QualityCheck, QCType } from '../entities/quality-check.entity';
import { ProductionMedia } from '../entities/production-media.entity';
import { CreateSupplierProductionOrderDto } from '../dto/create-supplier-production-order.dto';
import { SupplierProductionOrderQueryDto } from '../dto/supplier-production-order-query.dto';
import { UpdateMilestoneDto } from '../dto/update-milestone.dto';
import { SupplierMilestoneReportDto } from '../dto/supplier-milestone-report.dto';
import { CreateQualityCheckDto } from '../dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from '../dto/update-quality-check.dto';
import { AddProductionMediaDto } from '../dto/add-production-media.dto';

/**
 * Supplier production tracking service.
 *
 * Manages the production workflow that an overseas supplier executes
 * against our PurchaseOrders. Owns the standard milestone template,
 * supplier reporting and quality control records.
 *
 * Multi-tenant: tenant filter is automatic via `BaseTenantEntity.@Filter`
 * and a manual `TenantContext` check is enforced in write paths
 * (defense in depth).
 *
 * Error contract: every failure path throws a custom AppException so
 * the response carries a stable error code and an i18n key — no raw
 * TR/EN strings ever leave this layer.
 */
@Injectable()
export class ProductionService {
  /** Standard textile production milestone template. */
  static readonly DEFAULT_MILESTONE_TEMPLATE: Array<{
    code: StandardMilestoneCode;
    nameKey: string;
    sortOrder: number;
  }> = [
    {
      code: StandardMilestoneCode.DYEHOUSE,
      nameKey: 'milestones.dyehouse',
      sortOrder: 0,
    },
    {
      code: StandardMilestoneCode.WEAVING,
      nameKey: 'milestones.weaving',
      sortOrder: 1,
    },
    {
      code: StandardMilestoneCode.FINISHING,
      nameKey: 'milestones.finishing',
      sortOrder: 2,
    },
    { code: StandardMilestoneCode.QC, nameKey: 'milestones.qc', sortOrder: 3 },
    {
      code: StandardMilestoneCode.PACKAGING,
      nameKey: 'milestones.packaging',
      sortOrder: 4,
    },
    {
      code: StandardMilestoneCode.READY_FOR_PICKUP,
      nameKey: 'milestones.ready_for_pickup',
      sortOrder: 5,
    },
  ];

  constructor(
    @InjectRepository(SupplierProductionOrder)
    private readonly orderRepo: EntityRepository<SupplierProductionOrder>,
    @InjectRepository(ProductionMilestone)
    private readonly milestoneRepo: EntityRepository<ProductionMilestone>,
    @InjectRepository(QualityCheck)
    private readonly qcRepo: EntityRepository<QualityCheck>,
    @InjectRepository(ProductionMedia)
    private readonly mediaRepo: EntityRepository<ProductionMedia>,
    private readonly em: EntityManager,
  ) {}

  // ── Supplier production orders ──

  async findAllOrders(query: SupplierProductionOrderQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      supplierId,
      purchaseOrderId,
    } = query;
    const where: Record<string, unknown> = {};
    if (search) where.productionNumber = { $like: `%${search}%` };
    if (status) where.status = status;
    if (supplierId) where.supplier = supplierId;
    if (purchaseOrderId) where.purchaseOrder = purchaseOrderId;

    const [items, total] = await this.orderRepo.findAndCount(where, {
      populate: ['supplier', 'purchaseOrder', 'product', 'variant'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOrderById(id: string): Promise<SupplierProductionOrder> {
    const order = await this.orderRepo.findOne(
      { id },
      {
        populate: [
          'purchaseOrder',
          'supplier',
          'supplierContact',
          'product',
          'variant',
          'milestones',
          'qualityChecks',
          'media',
        ],
      },
    );
    if (!order) throw new SupplierProductionOrderNotFoundException(id);
    return order;
  }

  /**
   * Create a new supplier production order and seed the standard
   * milestone template. The tenant is read from the request context
   * (defense in depth) — caller does not need to provide it.
   */
  async createOrder(
    dto: CreateSupplierProductionOrderDto,
  ): Promise<SupplierProductionOrder> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const order = this.orderRepo.create({
      tenant,
      productionNumber: dto.productionNumber,
      purchaseOrder: dto.purchaseOrderId as unknown,
      supplier: dto.supplierId as unknown,
      supplierContact: dto.supplierContactId as unknown,
      product: dto.productId as unknown,
      variant: dto.variantId as unknown,
      plannedQuantity: dto.plannedQuantity,
      status: dto.status ?? SupplierProductionStatus.AWAITING_START,
      factoryLocation: dto.factoryLocation,
      estimatedStartDate: dto.estimatedStartDate
        ? new Date(dto.estimatedStartDate)
        : undefined,
      estimatedCompletionDate: dto.estimatedCompletionDate
        ? new Date(dto.estimatedCompletionDate)
        : undefined,
      notes: dto.notes,
    });
    await this.em.persistAndFlush(order);

    // Seed the standard milestone template. Names are stored as i18n
    // keys so the frontend localizes them; the service never writes
    // raw TR/EN strings to the database.
    for (const tpl of ProductionService.DEFAULT_MILESTONE_TEMPLATE) {
      const milestone = this.milestoneRepo.create({
        productionOrder: order,
        name: tpl.nameKey,
        code: tpl.code,
        sortOrder: tpl.sortOrder,
        tenant,
      });
      this.em.persist(milestone);
    }
    await this.em.flush();
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: SupplierProductionStatus,
  ): Promise<SupplierProductionOrder> {
    const order = await this.findOrderById(id);
    order.status = status;

    if (
      status === SupplierProductionStatus.IN_DYEHOUSE &&
      !order.actualStartDate
    ) {
      order.actualStartDate = new Date();
    }
    if (
      (status === SupplierProductionStatus.READY_TO_SHIP ||
        status === SupplierProductionStatus.SHIPPED) &&
      !order.actualCompletionDate
    ) {
      order.actualCompletionDate = new Date();
    }
    await this.em.flush();
    return order;
  }

  // ── Milestones ──

  async updateMilestone(
    id: string,
    dto: UpdateMilestoneDto,
  ): Promise<ProductionMilestone> {
    const ms = await this.milestoneRepo.findOne({ id });
    if (!ms) throw new ProductionMilestoneNotFoundException(id);

    if (dto.status === MilestoneStatus.IN_PROGRESS && !ms.startedAt) {
      ms.startedAt = new Date();
    }
    if (dto.status === MilestoneStatus.COMPLETED && !ms.completedAt) {
      ms.completedAt = new Date();
    }
    if (dto.status !== undefined) ms.status = dto.status;
    if (dto.startedAt !== undefined) ms.startedAt = new Date(dto.startedAt);
    if (dto.completedAt !== undefined)
      ms.completedAt = new Date(dto.completedAt);
    if (dto.note !== undefined) ms.note = dto.note;
    if (dto.assignedToId !== undefined)
      (ms as unknown as Record<string, unknown>).assignedTo = dto.assignedToId;
    await this.em.flush();
    return ms;
  }

  /**
   * Apply a milestone update reported by the supplier.
   * Bumps the parent order's `lastSupplierUpdateAt` so listeners can
   * detect freshness.
   */
  async reportMilestoneFromSupplier(
    id: string,
    dto: SupplierMilestoneReportDto,
  ): Promise<ProductionMilestone> {
    const ms = await this.milestoneRepo.findOne(
      { id },
      { populate: ['productionOrder'] },
    );
    if (!ms) throw new ProductionMilestoneNotFoundException(id);

    if (dto.status !== undefined) ms.status = dto.status;
    if (dto.mediaUrls !== undefined) ms.supplierMediaUrls = dto.mediaUrls;
    if (dto.note !== undefined) ms.note = dto.note;
    ms.reportedBySupplierAt = new Date();

    if (ms.productionOrder) {
      ms.productionOrder.lastSupplierUpdateAt = new Date();
    }
    await this.em.flush();
    return ms;
  }

  // ── Quality control ──

  async createQC(dto: CreateQualityCheckDto): Promise<QualityCheck> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const qc = this.qcRepo.create({
      tenant,
      productionOrder: dto.productionOrderId as unknown,
      qcType: dto.qcType ?? QCType.SUPPLIER_PRE_SHIPMENT,
      testType: dto.testType,
      testStandard: dto.testStandard,
      result: dto.result,
      measuredValue: dto.measuredValue,
      expectedValue: dto.expectedValue,
      testedAt: dto.testedAt ? new Date(dto.testedAt) : undefined,
      inspector: dto.inspectorId as unknown,
      note: dto.note,
      attachments: dto.attachments,
    });
    await this.em.persistAndFlush(qc);
    return qc;
  }

  async updateQC(
    id: string,
    dto: UpdateQualityCheckDto,
  ): Promise<QualityCheck> {
    const qc = await this.qcRepo.findOne({ id });
    if (!qc) throw new QualityCheckNotFoundException(id);
    this.em.assign(qc, dto as unknown as QualityCheck);
    await this.em.flush();
    return qc;
  }

  // ── Media ──

  async addMedia(dto: AddProductionMediaDto): Promise<ProductionMedia> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const media = this.mediaRepo.create({
      tenant,
      productionOrder: dto.productionOrderId as unknown,
      type: dto.type,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      description: dto.description,
      milestoneCode: dto.milestoneCode,
      uploadedBySupplier: dto.uploadedBySupplier ?? false,
    });
    await this.em.persistAndFlush(media);
    return media;
  }
}
