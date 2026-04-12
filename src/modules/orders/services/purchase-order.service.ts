import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  EntityNotFoundException,
  TenantContextMissingException,
} from '../../../common/errors/app.exceptions';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  PurchaseOrder,
  PurchaseOrderWorkflowStatus,
} from '../entities/purchase-order.entity';
import { PurchaseOrderLine } from '../entities/purchase-order-line.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdateDeliveryWarningConfigDto } from '../dto/update-delivery-warning-config.dto';
import { QrCodeService } from '../../../common/services/qr-code.service';

/**
 * Purchase Order service.
 *
 * Sprint 5 added:
 *  - `trackingUuid` generation at creation time
 *  - QR-code data-URL endpoint (`generateQr`) for the detail page / PDF
 *  - `createRevision` — marks the old row REVISED and clones forward
 *  - `updateDeliveryWarningConfig` — JSONB schedule for the
 *    cron-driven delivery reminder engine (Sprint 9)
 *
 * Error contract: failures throw our AppException subclasses so the
 * response carries a stable error code + i18n key.
 */
@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly em: EntityManager,
    private readonly qrCodeService: QrCodeService,
  ) {}

  async findAll(
    query: PaginatedQueryDto & { supplierId?: string },
  ): Promise<PaginatedResponse<PurchaseOrder>> {
    const where: FilterQuery<PurchaseOrder> = {};
    if (query.supplierId) where.supplier = query.supplierId;
    return QueryBuilderHelper.paginate(this.em, PurchaseOrder, query, {
      searchFields: ['orderNumber'],
      defaultSortBy: 'createdAt',
      where,
      populate: ['supplier', 'status', 'currency'] as never[],
    });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.em.findOne(
      PurchaseOrder,
      { id },
      {
        populate: [
          'supplier',
          'counterparty',
          'currency',
          'status',
          'createdBy',
          'revisedFrom',
          'lines',
          'lines.variant',
          'lines.variant.product',
          'lines.taxRate',
        ] as never[],
      },
    );
    if (!order) throw new EntityNotFoundException('PurchaseOrder', id);
    return order;
  }

  async create(
    data: CreatePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrder> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const count = await this.em.count(PurchaseOrder, {
      tenant: tenantId,
    } as FilterQuery<PurchaseOrder>);
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = this.em.create(PurchaseOrder, {
      tenant,
      orderNumber,
      trackingUuid: uuidv4(),
      workflowStatus: PurchaseOrderWorkflowStatus.DRAFT,
      supplier: this.em.getReference('Partner', data.supplierId),
      counterparty: data.counterpartyId
        ? this.em.getReference('Counterparty', data.counterpartyId)
        : undefined,
      currency: data.currencyId
        ? this.em.getReference('Currency', data.currencyId)
        : undefined,
      exchangeRate: data.exchangeRate,
      status: data.statusId
        ? this.em.getReference('StatusDefinition', data.statusId)
        : undefined,
      expectedDeliveryDate: data.expectedDeliveryDate
        ? new Date(data.expectedDeliveryDate)
        : undefined,
      containerInfo: data.containerInfo,
      note: data.note,
      createdBy: this.em.getReference('User', userId),
    } as unknown as PurchaseOrder);
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
          taxRate: lineData.taxRateId
            ? this.em.getReference('TaxRate', lineData.taxRateId)
            : undefined,
          lineTotal,
          note: lineData.note,
        } as unknown as PurchaseOrderLine);
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

  /**
   * Generate the public-tracking QR-code for a purchase order.
   *
   * The QR payload is a full URL pointing at `/track/:uuid` on the
   * configured public frontend — supplier scans the printed PDF and
   * lands on a read-only status page (Sprint 6 public route).
   *
   * Back-fills `trackingUuid` for legacy rows that pre-date Sprint 5.
   */
  async generateQr(
    id: string,
    publicBaseUrl: string,
  ): Promise<{ trackingUuid: string; trackingUrl: string; qrDataUrl: string }> {
    const order = await this.em.findOne(PurchaseOrder, { id });
    if (!order) throw new EntityNotFoundException('PurchaseOrder', id);

    if (!order.trackingUuid) {
      order.trackingUuid = uuidv4();
      await this.em.flush();
    }

    const trackingUrl = `${publicBaseUrl.replace(/\/$/, '')}/track/${order.trackingUuid}`;
    const qrDataUrl = await this.qrCodeService.generate(trackingUrl);
    return { trackingUuid: order.trackingUuid, trackingUrl, qrDataUrl };
  }

  /**
   * Open a new revision of a purchase order.
   *
   * The old row transitions to `REVISED` (becomes read-only for
   * editing flows) and a fresh row is cloned at `revisionNumber + 1`
   * pointing back via `revisedFrom`. The new row keeps the same
   * `orderNumber` for audit continuity but gets a fresh
   * `trackingUuid` so the old QR cannot leak edits.
   *
   * Only terminal-ish states may be revised — DRAFT is editable
   * directly, CANCELLED/CLOSED rows are frozen.
   */
  async createRevision(id: string, userId: string): Promise<PurchaseOrder> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const original = await this.findOne(id);

    const revisableStates: PurchaseOrderWorkflowStatus[] = [
      PurchaseOrderWorkflowStatus.PENDING_APPROVAL,
      PurchaseOrderWorkflowStatus.APPROVED,
      PurchaseOrderWorkflowStatus.SENT_TO_SUPPLIER,
      PurchaseOrderWorkflowStatus.IN_PRODUCTION,
      PurchaseOrderWorkflowStatus.SHIPPED,
    ];
    if (!revisableStates.includes(original.workflowStatus)) {
      throw new BadRequestException({
        errorCode: 'PURCHASE_ORDER_NOT_REVISABLE',
        i18nKey: 'errors.purchaseOrder.notRevisable',
        currentStatus: original.workflowStatus,
      });
    }

    original.workflowStatus = PurchaseOrderWorkflowStatus.REVISED;

    const revision = this.em.create(PurchaseOrder, {
      tenant,
      orderNumber: original.orderNumber,
      revisionNumber: original.revisionNumber + 1,
      revisedFrom: original,
      trackingUuid: uuidv4(),
      workflowStatus: PurchaseOrderWorkflowStatus.DRAFT,
      supplier: original.supplier,
      counterparty: original.counterparty,
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      status: original.status,
      expectedDeliveryDate: original.expectedDeliveryDate,
      actualDeliveryDate: undefined,
      totalAmount: original.totalAmount,
      taxAmount: original.taxAmount,
      grandTotal: original.grandTotal,
      downPaymentAmount: original.downPaymentAmount,
      paymentTerms: original.paymentTerms,
      deliveryWarningConfig: original.deliveryWarningConfig,
      containerInfo: original.containerInfo,
      note: original.note,
      createdBy: this.em.getReference('User', userId),
    } as unknown as PurchaseOrder);
    this.em.persist(revision);

    // Clone lines.
    for (const line of original.lines.getItems() as unknown as PurchaseOrderLine[]) {
      const newLine = this.em.create(PurchaseOrderLine, {
        tenant,
        order: revision,
        variant: line.variant,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        lineTotal: line.lineTotal,
        note: line.note,
      } as unknown as PurchaseOrderLine);
      this.em.persist(newLine);
    }

    await this.em.flush();
    return revision;
  }

  /**
   * Overwrite the delivery-warning schedule on a purchase order.
   *
   * The schedule is consumed by the notification cron (Sprint 9) —
   * until then this is a no-op from the system's point of view but
   * the config is persisted so teams can prepare the rollout.
   */
  async updateDeliveryWarningConfig(
    id: string,
    dto: UpdateDeliveryWarningConfigDto,
  ): Promise<PurchaseOrder> {
    const order = await this.em.findOne(PurchaseOrder, { id });
    if (!order) throw new EntityNotFoundException('PurchaseOrder', id);

    order.deliveryWarningConfig = dto.entries.map((e) => ({
      daysBefore: e.daysBefore,
      recipientGroupCodes: e.recipientGroupCodes,
      recipientUserIds: e.recipientUserIds,
    }));
    await this.em.flush();
    return order;
  }
}
