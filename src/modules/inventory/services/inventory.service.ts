import { Injectable, BadRequestException } from '@nestjs/common';
import {
  EntityNotFoundException,
  TenantContextMissingException,
  InventoryCutQuantityInvalidException,
} from '../../../common/errors/app.exceptions';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';
import {
  InventoryTransaction,
  TransactionType,
} from '../entities/inventory-transaction.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { KartelaGeneratorService } from './kartela-generator.service';

interface RollListQuery extends PaginatedQueryDto {
  variantId?: string;
  warehouseId?: string;
  status?: InventoryItemStatus;
  batchCode?: string;
  minQuantity?: number;
  maxQuantity?: number;
  shadeGroup?: string;
}

/**
 * Aggregated stock summary per product variant.
 *
 * Distinguishes between full rolls (never cut) and partial rolls
 * (cut at least once). `rollEquivalent` provides a single normalized
 * number for quick cross-product comparisons.
 */
export interface VariantStockSummary {
  variantId: string;
  rollCount: number;
  totalQuantity: number;
  totalReserved: number;
  fullRollCount: number;
  fullRollQuantity: number;
  partialRollCount: number;
  partialRollQuantity: number;
  rollEquivalent: number;
}

/**
 * Result of a split operation — both sides of the cut.
 */
export interface SplitRollResult {
  parent: InventoryItem;
  child: InventoryItem;
}

/**
 * Parent-child hierarchy for a kartela.
 */
export interface KartelaHierarchy {
  node: InventoryItem;
  parent: InventoryItem | null;
  children: InventoryItem[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly em: EntityManager,
    private readonly kartelaGenerator: KartelaGeneratorService,
  ) {}

  // ─── Top Listeleme ────────────────────────────────────────

  async findAll(
    query: RollListQuery,
  ): Promise<PaginatedResponse<InventoryItem>> {
    const where: FilterQuery<InventoryItem> = {};
    if (query.variantId) where.variant = query.variantId;
    if (query.warehouseId) where.warehouse = query.warehouseId;
    if (query.status) where.status = query.status;
    if (query.batchCode) where.batchCode = { $ilike: `%${query.batchCode}%` };
    if (query.shadeGroup) where.shadeGroup = query.shadeGroup;
    if (query.minQuantity)
      where.currentQuantity = {
        ...((where.currentQuantity as Record<string, unknown>) || {}),
        $gte: query.minQuantity,
      };
    if (query.maxQuantity)
      where.currentQuantity = {
        ...((where.currentQuantity as Record<string, unknown>) || {}),
        $lte: query.maxQuantity,
      };

    return QueryBuilderHelper.paginate(this.em, InventoryItem, query, {
      searchFields: ['barcode', 'batchCode'],
      defaultSortBy: 'receivedAt',
      where,
      populate: [
        'variant',
        'variant.product',
        'warehouse',
        'location',
      ] as never[],
    });
  }

  // ─── Top Detay ────────────────────────────────────────────

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.em.findOne(
      InventoryItem,
      { id },
      {
        populate: [
          'variant',
          'variant.product',
          'warehouse',
          'location',
          'receivedFrom',
          'transactions',
          'transactions.createdBy',
        ] as never[],
      },
    );
    if (!item) throw new EntityNotFoundException('InventoryItem', id);
    return item;
  }

  // ── Roll entry (from goods receive or direct) ──

  async createRoll(
    data: {
      variantId: string;
      barcode: string;
      quantity: number;
      batchCode?: string;
      warehouseId?: string;
      locationId?: string;
      costPrice?: number;
      costCurrencyId?: string;
      receivedFromId?: string;
      goodsReceiveId?: string;
    },
    userId?: string,
  ): Promise<InventoryItem> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const item = this.em.create(InventoryItem, {
      tenant,
      variant: this.em.getReference('ProductVariant', data.variantId),
      barcode: data.barcode,
      initialQuantity: data.quantity,
      currentQuantity: data.quantity,
      batchCode: data.batchCode,
      warehouse: data.warehouseId
        ? this.em.getReference('Warehouse', data.warehouseId)
        : undefined,
      location: data.locationId
        ? this.em.getReference('WarehouseLocation', data.locationId)
        : undefined,
      costPrice: data.costPrice,
      costCurrency: data.costCurrencyId
        ? this.em.getReference('Currency', data.costCurrencyId)
        : undefined,
      receivedFrom: data.receivedFromId
        ? this.em.getReference('Partner', data.receivedFromId)
        : undefined,
      goodsReceiveId: data.goodsReceiveId,
      receivedAt: new Date(),
      status: InventoryItemStatus.IN_STOCK,
    } as unknown as InventoryItem);

    this.em.persist(item);

    // Entry transaction
    const tx = this.em.create(InventoryTransaction, {
      item,
      type: TransactionType.PURCHASE,
      quantityChange: data.quantity,
      previousQuantity: 0,
      newQuantity: data.quantity,
      note: data.goodsReceiveId ? `GR:${data.goodsReceiveId}` : 'DIRECT_ENTRY',
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(tx);

    await this.em.flush();
    return item;
  }

  // ─── Kesim (Cut) ──────────────────────────────────────────

  async cutRoll(
    rollId: string,
    amount: number,
    referenceId?: string,
    note?: string,
    userId?: string,
  ): Promise<InventoryItem> {
    const item = await this.findOne(rollId);
    const available =
      Number(item.currentQuantity) - Number(item.reservedQuantity);

    if (amount <= 0) throw new InventoryCutQuantityInvalidException();
    if (amount > available) {
      throw new BadRequestException({
        error: 'STOCK_INSUFFICIENT',
        message: 'errors.inventory.stock_insufficient',
        metadata: { available, requested: amount },
      });
    }

    const prevQty = Number(item.currentQuantity);
    item.currentQuantity = prevQty - amount;

    // Mark as SOLD if quantity hits zero
    if (item.currentQuantity <= 0) {
      item.status = InventoryItemStatus.SOLD;
      item.currentQuantity = 0;
    }

    const tx = this.em.create(InventoryTransaction, {
      item,
      type: TransactionType.SALE_CUT,
      quantityChange: -amount,
      previousQuantity: prevQty,
      newQuantity: item.currentQuantity,
      referenceId,
      note: note || `Kesim: ${amount}`,
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(tx);

    await this.em.flush();
    return item;
  }

  // ─── Fire (Waste/Scrap) ───────────────────────────────────

  async markWaste(
    rollId: string,
    amount: number,
    note?: string,
    userId?: string,
  ): Promise<InventoryItem> {
    const item = await this.findOne(rollId);

    if (amount > Number(item.currentQuantity)) {
      throw new BadRequestException({
        error: 'WASTE_EXCEEDS_STOCK',
        message: 'errors.inventory.waste_exceeds_stock',
        metadata: { remaining: item.currentQuantity },
      });
    }

    const prevQty = Number(item.currentQuantity);
    item.currentQuantity = prevQty - amount;

    if (item.currentQuantity <= 0) {
      item.status = InventoryItemStatus.WASTE;
      item.currentQuantity = 0;
    }

    const tx = this.em.create(InventoryTransaction, {
      item,
      type: TransactionType.WASTE,
      quantityChange: -amount,
      previousQuantity: prevQty,
      newQuantity: item.currentQuantity,
      note: note || `Fire: ${amount}`,
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(tx);

    await this.em.flush();
    return item;
  }

  // ── Stock adjustment ──

  async adjustStock(
    rollId: string,
    newQuantity: number,
    note?: string,
    userId?: string,
  ): Promise<InventoryItem> {
    const item = await this.findOne(rollId);
    if (newQuantity < 0) {
      throw new BadRequestException({
        error: 'QUANTITY_NEGATIVE',
        message: 'errors.inventory.quantity_negative',
      });
    }

    const prevQty = Number(item.currentQuantity);
    const diff = newQuantity - prevQty;
    item.currentQuantity = newQuantity;

    if (newQuantity === 0) {
      item.status = InventoryItemStatus.CONSUMED;
    } else if (item.status !== InventoryItemStatus.IN_STOCK) {
      item.status = InventoryItemStatus.IN_STOCK;
    }

    const tx = this.em.create(InventoryTransaction, {
      item,
      type: TransactionType.ADJUSTMENT,
      quantityChange: diff,
      previousQuantity: prevQty,
      newQuantity,
      note: note || `ADJUSTMENT:${prevQty}->${newQuantity}`,
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(tx);

    await this.em.flush();
    return item;
  }

  // ── Movement history ──

  async getMovements(rollId: string): Promise<InventoryTransaction[]> {
    return this.em.find(
      InventoryTransaction,
      { item: rollId } as FilterQuery<InventoryTransaction>,
      {
        orderBy: { createdAt: 'DESC' },
        populate: ['createdBy'] as never[],
      },
    );
  }

  // ── Stock summary (by variant, full/partial breakdown) ──

  /**
   * Aggregated stock per variant with textile-aware full/partial split.
   *
   * Full rolls = status IN_STOCK or FULL (never cut).
   * Partial rolls = status PARTIAL (cut at least once, still has stock).
   * Roll equivalent = total current quantity divided by the average
   * initial quantity — a normalized count comparable across products.
   */
  async getSummary(variantId?: string): Promise<VariantStockSummary[]> {
    type Row = {
      variantId: string;
      rollCount: string;
      totalQuantity: string;
      totalReserved: string;
      avgInitialQuantity: string;
      fullRollCount: string;
      fullRollQuantity: string;
      partialRollCount: string;
      partialRollQuantity: string;
    };

    const activeStatuses = [
      InventoryItemStatus.IN_STOCK,
      InventoryItemStatus.RESERVED,
      InventoryItemStatus.FULL,
      InventoryItemStatus.PARTIAL,
      InventoryItemStatus.ALLOCATED,
    ];
    const fullStatuses = [
      InventoryItemStatus.IN_STOCK,
      InventoryItemStatus.FULL,
    ];
    const partialStatuses = [
      InventoryItemStatus.PARTIAL,
      InventoryItemStatus.ALLOCATED,
      InventoryItemStatus.RESERVED,
    ];

    const qb = this.em.createQueryBuilder(InventoryItem, 'i');
    qb.select([
      'i.variant_id as "variantId"',
      'count(i.id) as "rollCount"',
      'sum(i.current_quantity) as "totalQuantity"',
      'sum(i.reserved_quantity) as "totalReserved"',
      'avg(i.initial_quantity) as "avgInitialQuantity"',
      `count(*) filter (where i.status in ('${fullStatuses.join("','")}')) as "fullRollCount"`,
      `coalesce(sum(i.current_quantity) filter (where i.status in ('${fullStatuses.join("','")}')), 0) as "fullRollQuantity"`,
      `count(*) filter (where i.status in ('${partialStatuses.join("','")}')) as "partialRollCount"`,
      `coalesce(sum(i.current_quantity) filter (where i.status in ('${partialStatuses.join("','")}')), 0) as "partialRollQuantity"`,
    ]).where({
      deletedAt: null,
      status: { $in: activeStatuses },
    });

    if (variantId) {
      qb.andWhere({ variant: variantId });
    }

    qb.groupBy('i.variant_id');

    const rows = await qb.execute<Row[]>();

    return rows.map((r) => {
      const avgInitial = Number(r.avgInitialQuantity) || 0;
      const totalQty = Number(r.totalQuantity) || 0;
      return {
        variantId: r.variantId,
        rollCount: Number(r.rollCount) || 0,
        totalQuantity: totalQty,
        totalReserved: Number(r.totalReserved) || 0,
        fullRollCount: Number(r.fullRollCount) || 0,
        fullRollQuantity: Number(r.fullRollQuantity) || 0,
        partialRollCount: Number(r.partialRollCount) || 0,
        partialRollQuantity: Number(r.partialRollQuantity) || 0,
        rollEquivalent:
          avgInitial > 0 ? Number((totalQty / avgInitial).toFixed(2)) : 0,
      };
    });
  }

  // ─── Split Roll (Kartela Kesim) ───────────────────────────

  /**
   * Cut a roll into two kartelas: the original (reduced) and a new child.
   *
   * This is the textile-specific cut operation that creates a parent-child
   * kartela hierarchy. The child is created with status ALLOCATED so it
   * can be immediately reserved for an order, while the parent transitions
   * from FULL to PARTIAL (or SOLD if fully consumed).
   *
   * @param rollId UUID of the original roll
   * @param amountToCut metres to cut off into the new child kartela
   * @param userId optional actor for audit trail
   */
  async splitRoll(
    rollId: string,
    amountToCut: number,
    userId?: string,
  ): Promise<SplitRollResult> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const parent = await this.findOne(rollId);
    const available =
      Number(parent.currentQuantity) - Number(parent.reservedQuantity);

    if (amountToCut <= 0) throw new InventoryCutQuantityInvalidException();
    if (amountToCut > available) {
      throw new BadRequestException({
        error: 'STOCK_INSUFFICIENT',
        message: 'errors.inventory.stock_insufficient',
        metadata: { available, requested: amountToCut },
      });
    }

    const prevQty = Number(parent.currentQuantity);
    parent.currentQuantity = prevQty - amountToCut;

    // Parent status transition
    if (parent.currentQuantity <= 0) {
      parent.status = InventoryItemStatus.SOLD;
      parent.currentQuantity = 0;
    } else if (
      parent.status === InventoryItemStatus.FULL ||
      parent.status === InventoryItemStatus.IN_STOCK
    ) {
      parent.status = InventoryItemStatus.PARTIAL;
    }

    // Generate child kartela number (carries tenant via TenantContext)
    const childKartelaNumber = await this.kartelaGenerator.generate();
    const childBarcode = `${parent.barcode}-C${Date.now().toString(36).toUpperCase()}`;

    const child = this.em.create(InventoryItem, {
      tenant: parent.tenant,
      variant: parent.variant,
      barcode: childBarcode,
      kartelaNumber: childKartelaNumber,
      parentKartelaId: parent.id,
      initialQuantity: amountToCut,
      currentQuantity: amountToCut,
      reservedQuantity: 0,
      batchCode: parent.batchCode,
      warehouse: parent.warehouse,
      location: parent.location,
      costPrice: parent.costPrice,
      costCurrency: parent.costCurrency,
      receivedFrom: parent.receivedFrom,
      receivedAt: new Date(),
      shadeGroup: parent.shadeGroup,
      shadeVariation: parent.shadeVariation,
      shadeReference: parent.shadeReference,
      actualGSM: parent.actualGSM,
      gsmVariance: parent.gsmVariance,
      status: InventoryItemStatus.ALLOCATED,
    } as unknown as InventoryItem);
    this.em.persist(child);

    // Parent-side transaction (SALE_CUT — negative)
    const parentTx = this.em.create(InventoryTransaction, {
      item: parent,
      type: TransactionType.SALE_CUT,
      quantityChange: -amountToCut,
      previousQuantity: prevQty,
      newQuantity: parent.currentQuantity,
      note: `SPLIT → ${childKartelaNumber}`,
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(parentTx);

    // Child-side transaction (PURCHASE — positive, marks creation)
    const childTx = this.em.create(InventoryTransaction, {
      item: child,
      type: TransactionType.PURCHASE,
      quantityChange: amountToCut,
      previousQuantity: 0,
      newQuantity: amountToCut,
      note: `SPLIT FROM ${parent.kartelaNumber ?? parent.barcode}`,
      createdBy: userId ? this.em.getReference('User', userId) : undefined,
    } as unknown as InventoryTransaction);
    this.em.persist(childTx);

    await this.em.flush();
    return { parent, child };
  }

  /**
   * Return the parent and children of a kartela as a flat structure.
   */
  async getKartelaHierarchy(rollId: string): Promise<KartelaHierarchy> {
    const node = await this.findOne(rollId);
    const parent = node.parentKartelaId
      ? await this.em.findOne(InventoryItem, { id: node.parentKartelaId })
      : null;
    const children = await this.em.find(InventoryItem, {
      parentKartelaId: node.id,
    });
    return { node, parent, children };
  }
}
