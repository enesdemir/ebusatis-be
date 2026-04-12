import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../../inventory/entities/inventory-item.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { SalesOrderLine } from '../entities/sales-order-line.entity';
import {
  OrderRollAllocation,
  AllocationStatus,
} from '../entities/order-roll-allocation.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';

/**
 * Roll candidate returned for a SO line's allocation picker.
 */
export interface RollCandidate {
  id: string;
  kartelaNumber?: string;
  barcode: string;
  batchCode?: string;
  shadeGroup?: string;
  currentQuantity: number;
  reservedQuantity: number;
  available: number;
  status: InventoryItemStatus;
  receivedAt?: Date;
}

/**
 * Suggested allocation for a single roll.
 */
export interface AllocationSuggestion {
  rollId: string;
  kartelaNumber?: string;
  barcode: string;
  allocatedQuantity: number;
  cut: boolean; // true when this roll must be split to fulfil the order
  cutAmount?: number;
}

export interface AllocationPreview {
  required: number;
  availableTotal: number;
  suggestions: AllocationSuggestion[];
  cutRequired: boolean;
  fullRollsUsed: number;
  partialRollsUsed: number;
  totalAllocated: number;
  /** True when the preview cannot fulfil the requested quantity. */
  short: boolean;
  shortBy: number;
}

/**
 * Allocation service — FIFO roll picking + optional split on last roll.
 *
 * The service is the integration point between `SalesOrderLine` and
 * `InventoryItem`. It reuses `InventoryService.splitRoll` from Sprint 1
 * to create parent-child kartela hierarchy when a cut is required.
 *
 * Order of preference (FIFO):
 *   1. Full rolls matching the line's variant (oldest `receivedAt` first)
 *   2. Partial rolls (so we consume remnants first — optional behavior)
 *   3. Last full roll is cut if the remaining quantity < full roll size
 */
@Injectable()
export class AllocationService {
  constructor(
    private readonly em: EntityManager,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Return FIFO-sorted candidates for a SO line's variant.
   */
  async getAvailableRollsForLine(
    orderLineId: string,
  ): Promise<RollCandidate[]> {
    const line = await this.em.findOneOrFail(
      SalesOrderLine,
      {
        id: orderLineId,
      },
      { populate: ['variant'] as never[] },
    );

    const rolls = await this.em.find(
      InventoryItem,
      {
        variant: line.variant.id,
        status: {
          $in: [
            InventoryItemStatus.IN_STOCK,
            InventoryItemStatus.FULL,
            InventoryItemStatus.PARTIAL,
          ],
        },
      },
      { orderBy: { receivedAt: 'ASC', createdAt: 'ASC' } },
    );

    return rolls
      .map((r) => ({
        id: r.id,
        kartelaNumber: r.kartelaNumber,
        barcode: r.barcode,
        batchCode: r.batchCode,
        shadeGroup: r.shadeGroup,
        currentQuantity: Number(r.currentQuantity),
        reservedQuantity: Number(r.reservedQuantity),
        available: Number(r.currentQuantity) - Number(r.reservedQuantity),
        status: r.status,
        receivedAt: r.receivedAt,
      }))
      .filter((c) => c.available > 0);
  }

  /**
   * Preview what the FIFO algorithm would allocate for `requiredQty`.
   * Never mutates state. Returns whether a cut is needed on the last roll.
   */
  async previewAllocation(
    orderLineId: string,
    requiredQty: number,
  ): Promise<AllocationPreview> {
    const candidates = await this.getAvailableRollsForLine(orderLineId);
    const availableTotal = candidates.reduce((s, c) => s + c.available, 0);

    let remaining = requiredQty;
    let fullRollsUsed = 0;
    let partialRollsUsed = 0;
    const suggestions: AllocationSuggestion[] = [];

    for (const c of candidates) {
      if (remaining <= 0) break;
      const take = Math.min(c.available, remaining);
      const needsCut = take < c.available;

      suggestions.push({
        rollId: c.id,
        kartelaNumber: c.kartelaNumber,
        barcode: c.barcode,
        allocatedQuantity: take,
        cut: needsCut,
        cutAmount: needsCut ? take : undefined,
      });

      if (c.status === InventoryItemStatus.PARTIAL) partialRollsUsed += 1;
      else fullRollsUsed += 1;

      remaining -= take;
    }

    const totalAllocated = suggestions.reduce(
      (s, x) => s + x.allocatedQuantity,
      0,
    );

    return {
      required: requiredQty,
      availableTotal,
      suggestions,
      cutRequired: suggestions.some((s) => s.cut),
      fullRollsUsed,
      partialRollsUsed,
      totalAllocated,
      short: remaining > 0,
      shortBy: Math.max(0, remaining),
    };
  }

  /**
   * Execute a FIFO allocation. When a cut is needed and `approveCut=true`,
   * splits the roll via InventoryService (parent-child kartela).
   * Creates one OrderRollAllocation per suggestion.
   */
  async allocateForLine(
    orderLineId: string,
    requiredQty: number,
    approveCut: boolean,
    userId?: string,
  ): Promise<{
    allocations: OrderRollAllocation[];
    preview: AllocationPreview;
  }> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const preview = await this.previewAllocation(orderLineId, requiredQty);

    if (preview.short) {
      throw new BadRequestException({
        error: 'STOCK_INSUFFICIENT',
        message: 'errors.orders.stock_insufficient',
        metadata: { required: requiredQty, available: preview.availableTotal },
      });
    }

    if (preview.cutRequired && !approveCut) {
      throw new BadRequestException({
        error: 'CUT_APPROVAL_REQUIRED',
        message: 'errors.orders.cut_approval_required',
        metadata: { preview },
      });
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const line = await this.em.findOneOrFail(SalesOrderLine, {
      id: orderLineId,
    });

    const results: OrderRollAllocation[] = [];

    for (const s of preview.suggestions) {
      if (s.cut && s.cutAmount) {
        // Split the roll via Sprint 1 splitRoll service.
        const split = await this.inventoryService.splitRoll(
          s.rollId,
          s.cutAmount,
          userId,
        );
        // Allocate against the child kartela (created as ALLOCATED).
        const alloc = this.em.create(OrderRollAllocation, {
          tenant,
          orderLine: line,
          roll: split.child,
          allocatedQuantity: s.cutAmount,
          status: AllocationStatus.RESERVED,
        } as unknown as OrderRollAllocation);
        split.child.reservedQuantity = s.cutAmount;
        this.em.persist(alloc);
        results.push(alloc);
      } else {
        // Allocate full roll (or partial remaining) directly.
        const roll = await this.em.findOneOrFail(InventoryItem, {
          id: s.rollId,
        });
        roll.reservedQuantity =
          Number(roll.reservedQuantity) + s.allocatedQuantity;
        const alloc = this.em.create(OrderRollAllocation, {
          tenant,
          orderLine: line,
          roll,
          allocatedQuantity: s.allocatedQuantity,
          status: AllocationStatus.RESERVED,
        } as unknown as OrderRollAllocation);
        this.em.persist(alloc);
        results.push(alloc);
      }
    }

    await this.em.flush();
    return { allocations: results, preview };
  }

  /**
   * Mark a RESERVED allocation as CUT once its child kartela has been
   * physically cut. No-ops if the allocation is already CUT/CANCELLED.
   */
  async confirmCut(allocationId: string): Promise<OrderRollAllocation> {
    const alloc = await this.em.findOneOrFail(OrderRollAllocation, {
      id: allocationId,
    });
    if (alloc.status !== AllocationStatus.RESERVED) return alloc;
    alloc.status = AllocationStatus.CUT;
    alloc.cutAt = new Date();
    await this.em.flush();
    return alloc;
  }

  /**
   * Cancel a RESERVED allocation and release the roll's reservedQuantity.
   */
  async cancelAllocation(allocationId: string): Promise<OrderRollAllocation> {
    const alloc = await this.em.findOneOrFail(
      OrderRollAllocation,
      { id: allocationId },
      { populate: ['roll'] as never[] },
    );
    if (alloc.status === AllocationStatus.CANCELLED) return alloc;
    if (alloc.status === AllocationStatus.RESERVED) {
      const roll = alloc.roll;
      roll.reservedQuantity = Math.max(
        0,
        Number(roll.reservedQuantity) - Number(alloc.allocatedQuantity),
      );
    }
    alloc.status = AllocationStatus.CANCELLED;
    await this.em.flush();
    return alloc;
  }
}
