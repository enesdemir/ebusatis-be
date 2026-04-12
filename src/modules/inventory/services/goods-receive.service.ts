import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
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
      ] as never[],
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
        ] as never[],
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
    } as FilterQuery<GoodsReceive>);
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
    } as unknown as GoodsReceive);
    this.em.persist(gr);

    // Sprint 4: collect quarantined rolls to auto-open a claim at the end.
    interface QuarantinedRoll {
      rollId: string;
      discrepancy: DiscrepancyType;
      note?: string;
      variantId: string;
      quantity: number;
    }
    const quarantinedRolls: QuarantinedRoll[] = [];

    // Create one line per variant and N inventory rolls per line.
    const { InventoryItemStatus: ItemStatus } =
      await import('../entities/inventory-item.entity');

    for (const lineData of dto.lines) {
      let totalQty = 0;
      let hasDiscrepancy = false;
      for (const rollData of lineData.rolls) {
        totalQty += rollData.quantity;

        // Compute GSM variance if actualGSM + standardGSM are available.
        let gsmVariance: number | undefined;
        if (rollData.actualGSM) {
          const variant = await this.em.findOne(
            'ProductVariant' as never,
            { id: lineData.variantId } as never,
          );
          const std = Number(
            (variant as { standardGSM?: number } | null)?.standardGSM,
          );
          if (std > 0) {
            gsmVariance =
              Math.round(((rollData.actualGSM - std) / std) * 10000) / 100;
          }
        }

        const isQuarantine =
          rollData.discrepancy && rollData.discrepancy !== DiscrepancyType.NONE;
        const rollStatus = isQuarantine
          ? ItemStatus.QUARANTINED
          : (rollData.status ?? ItemStatus.FULL);

        const item = await this.inventoryService.createRoll(
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
            shadeGroup: rollData.shadeGroup,
            shadeVariation: rollData.shadeVariation,
            shadeReference: rollData.shadeReference,
            actualGSM: rollData.actualGSM,
            gsmVariance,
            status: rollStatus,
          },
          userId,
        );

        if (isQuarantine) {
          hasDiscrepancy = true;
          quarantinedRolls.push({
            rollId: item.id,
            discrepancy: rollData.discrepancy!,
            note: rollData.discrepancyNote,
            variantId: lineData.variantId,
            quantity: rollData.quantity,
          });
        }
      }

      const line = this.em.create(GoodsReceiveLine, {
        tenant,
        goodsReceive: gr,
        variant: this.em.getReference('ProductVariant', lineData.variantId),
        receivedRollCount: lineData.rolls.length,
        totalReceivedQuantity: totalQty,
        discrepancyType: hasDiscrepancy
          ? DiscrepancyType.DAMAGED
          : DiscrepancyType.NONE,
        note: lineData.note,
      } as unknown as GoodsReceiveLine);
      this.em.persist(line);
    }

    await this.em.flush();

    // Sprint 4: auto-update PO actual delivery date
    if (dto.purchaseOrderId) {
      const po = await this.em.findOne(PurchaseOrder, {
        id: dto.purchaseOrderId,
      });
      if (po) {
        (
          po as PurchaseOrder & { actualDeliveryDate?: Date }
        ).actualDeliveryDate = new Date();
        await this.em.flush();
      }
    }

    // Sprint 4: auto-open SupplierClaim for quarantined rolls
    if (quarantinedRolls.length > 0) {
      await this.autoCreateClaim(
        tenant,
        gr,
        dto.supplierId,
        dto.purchaseOrderId,
        quarantinedRolls,
        userId,
      );
    }

    return gr;
  }

  /**
   * Auto-open a SupplierClaim for a batch of quarantined rolls.
   * Called from `create()` when any roll has a non-NONE discrepancy.
   */
  private async autoCreateClaim(
    tenant: Tenant,
    gr: GoodsReceive,
    supplierId: string,
    purchaseOrderId: string | undefined,
    rolls: Array<{
      rollId: string;
      discrepancy: DiscrepancyType;
      note?: string;
      variantId: string;
      quantity: number;
    }>,
    userId: string,
  ): Promise<void> {
    const { SupplierClaim, ClaimType, ClaimStatus } =
      await import('../entities/supplier-claim.entity');
    const { SupplierClaimLine } =
      await import('../entities/supplier-claim-line.entity');

    const count = await this.em.count(SupplierClaim, {
      tenant: tenant.id,
    } as unknown as FilterQuery<InstanceType<typeof SupplierClaim>>);
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const claim = this.em.create(SupplierClaim, {
      tenant,
      claimNumber,
      supplier: this.em.getReference(Partner, supplierId),
      goodsReceive: gr,
      purchaseOrder: purchaseOrderId
        ? this.em.getReference(PurchaseOrder, purchaseOrderId)
        : undefined,
      claimType: ClaimType.DAMAGED,
      status: ClaimStatus.OPEN,
      description: `Auto-generated from GR ${gr.receiveNumber} (${rolls.length} quarantined roll(s))`,
      openedAt: new Date(),
      openedBy: this.em.getReference(User, userId),
    } as unknown as object);
    this.em.persist(claim);

    for (const r of rolls) {
      const claimLine = this.em.create(SupplierClaimLine, {
        tenant,
        claim,
        variant: this.em.getReference('ProductVariant', r.variantId),
        quantity: r.quantity,
        claimedAmount: 0,
        note: `Roll ${r.rollId}: ${r.discrepancy} — ${r.note ?? 'auto'}`,
      } as unknown as object);
      this.em.persist(claimLine);
    }

    await this.em.flush();
  }

  // ── Discrepancy reporting ──

  async findLineById(id: string): Promise<GoodsReceiveLine> {
    const line = await this.em.findOne(
      GoodsReceiveLine,
      { id },
      { populate: ['variant', 'claim', 'goodsReceive'] as never[] },
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
