import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  GoodsReceive,
  GoodsReceiveStatus,
} from '../entities/goods-receive.entity';
import {
  GoodsReceiveLine,
  DiscrepancyType,
} from '../entities/goods-receive-line.entity';
import { InventoryService } from './inventory.service';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  GoodsReceiveNotFoundException,
  GoodsReceiveLineNotFoundException,
} from '../../../common/errors/app.exceptions';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { CreateGoodsReceiveDto } from '../dto/create-goods-receive.dto';
import { GoodsReceiveQueryDto } from '../dto/goods-receive-query.dto';
import { ReportDiscrepancyDto } from '../dto/report-discrepancy.dto';

/**
 * Goods Receive service.
 *
 * Owns the warehouse-arrival flow: register the truck (vehicle, driver,
 * responsible user), record the rolls and quantities, and report any
 * discrepancies that the warehouse team finds during inspection.
 *
 * Multi-tenant: enforced via `BaseTenantEntity.@Filter('tenant')` and
 * a manual `TenantContext` check on every write path (defense in depth).
 *
 * Error contract: every failure path throws a custom AppException so
 * the response carries a stable error code and an i18n key — no raw
 * TR/EN strings ever leave this layer.
 */
@Injectable()
export class GoodsReceiveService {
  constructor(
    private readonly em: EntityManager,
    private readonly inventoryService: InventoryService,
  ) {}

  // ── Read ──

  async findAll(
    query: GoodsReceiveQueryDto,
  ): Promise<PaginatedResponse<GoodsReceive>> {
    return QueryBuilderHelper.paginate(this.em, GoodsReceive, query, {
      searchFields: ['receiveNumber'],
      defaultSortBy: 'receivedAt',
      populate: [
        'supplier',
        'warehouse',
        'createdBy',
        'purchaseOrder',
        'shipment',
      ] as any,
    });
  }

  async findOne(id: string): Promise<GoodsReceive> {
    const gr = await this.em.findOne(
      GoodsReceive,
      { id },
      {
        populate: [
          'supplier',
          'warehouse',
          'createdBy',
          'receivedBy',
          'shipmentResponsible',
          'purchaseOrder',
          'shipment',
          'lines',
          'lines.variant',
          'lines.claim',
        ] as any,
      },
    );
    if (!gr) throw new GoodsReceiveNotFoundException(id);
    return gr;
  }

  /**
   * Create a goods receive with all its rolls in a single call.
   *
   * Side effects on completion:
   *  - one `GoodsReceiveLine` per variant
   *  - one `InventoryItem` per roll
   *  - one `PURCHASE` `InventoryTransaction` per roll
   *
   * The tenant is read from the request context (defense in depth) so
   * the caller does not need to provide it.
   */
  async create(
    dto: CreateGoodsReceiveDto,
    userId: string,
  ): Promise<GoodsReceive> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    // Tenant-scoped sequence number.
    const count = await this.em.count(GoodsReceive, {
      tenant: tenantId,
    } as any);
    const receiveNumber = `GR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const gr = this.em.create(GoodsReceive, {
      tenant,
      receiveNumber,
      supplier: this.em.getReference(Partner, dto.supplierId),
      warehouse: this.em.getReference(Warehouse, dto.warehouseId),
      purchaseOrder: dto.purchaseOrderId
        ? this.em.getReference(PurchaseOrder, dto.purchaseOrderId)
        : undefined,
      shipment: dto.shipmentId
        ? this.em.getReference(Shipment, dto.shipmentId)
        : undefined,
      vehiclePlate: dto.vehiclePlate,
      vehicleType: dto.vehicleType,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      driverIdNumber: dto.driverIdNumber,
      eta: dto.eta ? new Date(dto.eta) : undefined,
      receivedBy: dto.receivedById
        ? this.em.getReference(User, dto.receivedById)
        : undefined,
      shipmentResponsible: dto.shipmentResponsibleId
        ? this.em.getReference(User, dto.shipmentResponsibleId)
        : undefined,
      note: dto.note,
      createdBy: this.em.getReference(User, userId),
      status: GoodsReceiveStatus.COMPLETED,
      receivedAt: new Date(),
    } as any);
    this.em.persist(gr);

    // Create one line per variant and N inventory rolls per line.
    for (const lineData of dto.lines) {
      let totalQty = 0;
      for (const rollData of lineData.rolls) {
        totalQty += rollData.quantity;
        await this.inventoryService.createRoll(
          {
            variantId: lineData.variantId,
            barcode: rollData.barcode,
            quantity: rollData.quantity,
            batchCode: rollData.batchCode,
            warehouseId: dto.warehouseId,
            locationId: rollData.locationId,
            costPrice: rollData.costPrice,
            receivedFromId: dto.supplierId,
            goodsReceiveId: gr.id,
          },
          userId,
        );
      }

      const line = this.em.create(GoodsReceiveLine, {
        tenant,
        goodsReceive: gr,
        variant: this.em.getReference('ProductVariant', lineData.variantId),
        receivedRollCount: lineData.rolls.length,
        totalReceivedQuantity: totalQty,
        note: lineData.note,
      } as any);
      this.em.persist(line);
    }

    await this.em.flush();
    return gr;
  }

  // ── Discrepancy reporting ──

  async findLineById(id: string): Promise<GoodsReceiveLine> {
    const line = await this.em.findOne(
      GoodsReceiveLine,
      { id },
      { populate: ['variant', 'claim', 'goodsReceive'] as any },
    );
    if (!line) throw new GoodsReceiveLineNotFoundException(id);
    return line;
  }

  /**
   * Update or clear the discrepancy on a goods receive line.
   *
   * If `discrepancyType` is omitted, the existing type is left
   * untouched and only the auxiliary fields are updated. If the caller
   * explicitly passes `NONE`, every discrepancy field is cleared back
   * to its default state.
   */
  async reportDiscrepancy(
    lineId: string,
    dto: ReportDiscrepancyDto,
  ): Promise<GoodsReceiveLine> {
    const line = await this.findLineById(lineId);

    if (dto.discrepancyType === DiscrepancyType.NONE) {
      line.discrepancyType = DiscrepancyType.NONE;
      line.discrepancyQuantity = undefined;
      line.discrepancyReason = undefined;
      line.conditionNotes = undefined;
      line.photoEvidenceUrls = undefined;
    } else if (dto.discrepancyType !== undefined) {
      line.discrepancyType = dto.discrepancyType;
    }

    if (dto.discrepancyQuantity !== undefined) {
      line.discrepancyQuantity = dto.discrepancyQuantity;
    }
    if (dto.discrepancyReason !== undefined) {
      line.discrepancyReason = dto.discrepancyReason;
    }
    if (dto.conditionNotes !== undefined) {
      line.conditionNotes = dto.conditionNotes;
    }
    if (dto.photoEvidenceUrls !== undefined) {
      line.photoEvidenceUrls = dto.photoEvidenceUrls;
    }

    await this.em.flush();
    return line;
  }
}
