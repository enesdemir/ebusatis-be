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

interface RollListQuery extends PaginatedQueryDto {
  variantId?: string;
  warehouseId?: string;
  status?: InventoryItemStatus;
  batchCode?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly em: EntityManager) {}

  // ─── Top Listeleme ────────────────────────────────────────

  async findAll(
    query: RollListQuery,
  ): Promise<PaginatedResponse<InventoryItem>> {
    const where: FilterQuery<InventoryItem> = {};
    if (query.variantId) where.variant = query.variantId;
    if (query.warehouseId) where.warehouse = query.warehouseId;
    if (query.status) where.status = query.status;
    if (query.batchCode) where.batchCode = { $ilike: `%${query.batchCode}%` };
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

  // ── Stock summary (by variant) ──

  async getSummary(): Promise<
    {
      variantId: string;
      rollCount: string;
      totalQuantity: string;
      totalReserved: string;
    }[]
  > {
    type SummaryRow = {
      variantId: string;
      rollCount: string;
      totalQuantity: string;
      totalReserved: string;
    };
    const qb = this.em.createQueryBuilder(InventoryItem, 'i');
    const result = await qb
      .select([
        'i.variant_id as "variantId"',
        'count(i.id) as "rollCount"',
        'sum(i.current_quantity) as "totalQuantity"',
        'sum(i.reserved_quantity) as "totalReserved"',
      ])
      .where({
        deletedAt: null,
        status: {
          $in: [InventoryItemStatus.IN_STOCK, InventoryItemStatus.RESERVED],
        },
      })
      .groupBy('i.variant_id')
      .execute<SummaryRow[]>();
    return result;
  }
}
