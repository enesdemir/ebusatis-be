import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Picking, PickingStatus } from '../entities/picking.entity';
import { PickingLine } from '../entities/picking-line.entity';
import {
  OrderRollAllocation,
  AllocationStatus,
} from '../entities/order-roll-allocation.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
  PickingNotFoundException,
  PickingAlreadyExistsException,
  PickingNotInProgressException,
  PickingIncompleteException,
  SalesOrderNotAllocatedException,
  KartelaNotFoundForOrderException,
  KartelaAlreadyPickedException,
} from '../../../common/errors/app.exceptions';

/**
 * Result of scanning a kartela during picking.
 */
export interface ScanResult {
  pickingLine: PickingLine;
  remaining: number;
  complete: boolean;
}

/**
 * PickingService (Sprint 10).
 *
 * Owns the lifecycle of a Picking header and the barcode-driven scan
 * flow that confirms every OrderRollAllocation has been physically
 * collected from the warehouse shelves. A Picking can only be started
 * after the SalesOrder has reached status `ALLOCATED`.
 */
@Injectable()
export class PickingService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Picking)
    private readonly pickingRepo: EntityRepository<Picking>,
    @InjectRepository(PickingLine)
    private readonly pickingLineRepo: EntityRepository<PickingLine>,
    @InjectRepository(OrderRollAllocation)
    private readonly allocationRepo: EntityRepository<OrderRollAllocation>,
    @InjectRepository(SalesOrder)
    private readonly soRepo: EntityRepository<SalesOrder>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: EntityRepository<InventoryItem>,
  ) {}

  async findBySalesOrder(salesOrderId: string): Promise<Picking | null> {
    return this.pickingRepo.findOne(
      { salesOrder: salesOrderId },
      { populate: ['lines'] as never[] },
    );
  }

  async findById(id: string): Promise<Picking> {
    const picking = await this.pickingRepo.findOne(
      { id },
      { populate: ['lines', 'salesOrder', 'picker'] as never[] },
    );
    if (!picking) throw new PickingNotFoundException(id);
    return picking;
  }

  /**
   * Start a picking for a SalesOrder in ALLOCATED status.
   * Creates the Picking header (status=IN_PROGRESS) but no lines yet —
   * lines are created by `scanKartela` calls.
   */
  async startPicking(
    salesOrderId: string,
    notes?: string,
    userId?: string,
  ): Promise<Picking> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const so = await this.soRepo.findOne({ id: salesOrderId });
    if (!so) throw new EntityNotFoundException('SalesOrder', salesOrderId);
    if (so.workflowStatus !== SalesOrderStatus.ALLOCATED) {
      throw new SalesOrderNotAllocatedException(
        salesOrderId,
        so.workflowStatus,
      );
    }

    const existing = await this.pickingRepo.findOne({
      salesOrder: salesOrderId,
    });
    if (existing) {
      throw new PickingAlreadyExistsException(salesOrderId, existing.id);
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const pickingNumber = await this.generatePickingNumber();

    const picker = userId ? await this.em.findOne(User, { id: userId }) : null;

    const picking = this.pickingRepo.create({
      tenant,
      salesOrder: so,
      pickingNumber,
      status: PickingStatus.IN_PROGRESS,
      picker: picker ?? undefined,
      startedAt: new Date(),
      notes,
    } as unknown as Picking);

    await this.em.persistAndFlush(picking);
    return picking;
  }

  /**
   * Scan a kartela barcode. Validates the kartela belongs to an open
   * allocation on the SalesOrder, creates a PickingLine, and returns
   * progress info.
   */
  async scanKartela(
    pickingId: string,
    barcode: string,
    userId?: string,
  ): Promise<ScanResult> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const picking = await this.pickingRepo.findOne(
      { id: pickingId },
      { populate: ['salesOrder'] as never[] },
    );
    if (!picking) throw new PickingNotFoundException(pickingId);
    if (picking.status !== PickingStatus.IN_PROGRESS) {
      throw new PickingNotInProgressException(pickingId, picking.status);
    }

    const roll = await this.inventoryRepo.findOne({ barcode });
    if (!roll) {
      throw new KartelaNotFoundForOrderException(
        barcode,
        picking.salesOrder.id,
      );
    }

    const allocation = await this.allocationRepo.findOne(
      {
        roll,
        orderLine: { order: picking.salesOrder.id },
        status: { $in: [AllocationStatus.RESERVED, AllocationStatus.CUT] },
      },
      { populate: ['orderLine'] as never[] },
    );
    if (!allocation) {
      throw new KartelaNotFoundForOrderException(
        barcode,
        picking.salesOrder.id,
      );
    }

    const alreadyPicked = await this.pickingLineRepo.findOne({
      picking: picking.id,
      allocation: allocation.id,
    });
    if (alreadyPicked) throw new KartelaAlreadyPickedException(barcode);

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const scannedBy = userId
      ? await this.em.findOne(User, { id: userId })
      : null;

    const line = this.pickingLineRepo.create({
      tenant,
      picking,
      allocation,
      orderLine: allocation.orderLine,
      scannedBarcode: barcode,
      pickedQuantity: allocation.allocatedQuantity,
      scannedAt: new Date(),
      scannedBy: scannedBy ?? undefined,
    } as unknown as PickingLine);
    this.em.persist(line);

    await this.em.flush();

    const remaining = await this.remainingAllocationsCount(picking.id);
    return { pickingLine: line, remaining, complete: remaining === 0 };
  }

  /**
   * Complete a picking. Requires every allocation on the SO to have a
   * matching PickingLine. Does not change SalesOrder status by itself —
   * PackingService.completePacking is the gate that moves the SO to
   * READY_FOR_SHIPMENT.
   */
  async completePicking(pickingId: string): Promise<Picking> {
    const picking = await this.pickingRepo.findOne({ id: pickingId });
    if (!picking) throw new PickingNotFoundException(pickingId);
    if (picking.status !== PickingStatus.IN_PROGRESS) {
      throw new PickingNotInProgressException(pickingId, picking.status);
    }

    const remaining = await this.remainingAllocationsCount(pickingId);
    if (remaining > 0) {
      throw new PickingIncompleteException(pickingId, remaining);
    }

    picking.status = PickingStatus.COMPLETED;
    picking.completedAt = new Date();
    await this.em.flush();
    return picking;
  }

  async cancelPicking(pickingId: string): Promise<Picking> {
    const picking = await this.pickingRepo.findOne({ id: pickingId });
    if (!picking) throw new PickingNotFoundException(pickingId);
    if (picking.status === PickingStatus.CANCELLED) return picking;
    picking.status = PickingStatus.CANCELLED;
    await this.em.flush();
    return picking;
  }

  /**
   * Number of OrderRollAllocations on the SO that have not yet been
   * picked on this picking header.
   */
  private async remainingAllocationsCount(pickingId: string): Promise<number> {
    const picking = await this.pickingRepo.findOneOrFail(
      { id: pickingId },
      { populate: ['salesOrder'] as never[] },
    );
    const allocations = await this.allocationRepo.find({
      orderLine: { order: picking.salesOrder.id },
      status: { $in: [AllocationStatus.RESERVED, AllocationStatus.CUT] },
    });
    const pickedCount = await this.pickingLineRepo.count({
      picking: picking.id,
    });
    return Math.max(0, allocations.length - pickedCount);
  }

  private async generatePickingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PK-${year}-`;
    const last = await this.pickingRepo.findOne(
      { pickingNumber: { $like: `${prefix}%` } },
      { orderBy: { pickingNumber: 'DESC' } },
    );
    const nextSeq = last
      ? parseInt(last.pickingNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
}
