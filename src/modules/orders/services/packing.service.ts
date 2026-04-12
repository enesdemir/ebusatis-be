import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Packing, PackingStatus } from '../entities/packing.entity';
import { PackingBox } from '../entities/packing-box.entity';
import { PickingLine } from '../entities/picking-line.entity';
import { Picking, PickingStatus as PStatus } from '../entities/picking.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  PackingNotFoundException,
  PackingNotInProgressException,
  PackingBoxNotFoundException,
  PickingNotFoundException,
  PickingNotInProgressException,
  PickingLineAlreadyBoxedException,
  PickingLineNotInPickingException,
} from '../../../common/errors/app.exceptions';

/**
 * PackingService (Sprint 10).
 *
 * Groups picked kartelas into physical boxes and generates a barcode
 * per box. When every PickingLine is boxed, `completePacking` moves
 * the SalesOrder to READY_FOR_SHIPMENT which the OutboundShipment
 * service then consumes.
 */
@Injectable()
export class PackingService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Packing)
    private readonly packingRepo: EntityRepository<Packing>,
    @InjectRepository(PackingBox)
    private readonly boxRepo: EntityRepository<PackingBox>,
    @InjectRepository(PickingLine)
    private readonly pickingLineRepo: EntityRepository<PickingLine>,
    @InjectRepository(Picking)
    private readonly pickingRepo: EntityRepository<Picking>,
    @InjectRepository(SalesOrder)
    private readonly soRepo: EntityRepository<SalesOrder>,
  ) {}

  async findById(id: string): Promise<Packing> {
    const packing = await this.packingRepo.findOne(
      { id },
      { populate: ['boxes', 'picking', 'packer'] as never[] },
    );
    if (!packing) throw new PackingNotFoundException(id);
    return packing;
  }

  async findByPicking(pickingId: string): Promise<Packing | null> {
    return this.packingRepo.findOne({ picking: pickingId });
  }

  /**
   * Start packing for a completed picking. Creates the Packing header
   * in IN_PROGRESS state.
   */
  async startPacking(pickingId: string, userId?: string): Promise<Packing> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const picking = await this.pickingRepo.findOne({ id: pickingId });
    if (!picking) throw new PickingNotFoundException(pickingId);
    if (picking.status !== PStatus.COMPLETED) {
      throw new PickingNotInProgressException(pickingId, picking.status);
    }

    const existing = await this.packingRepo.findOne({ picking: pickingId });
    if (existing) return existing;

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const packingNumber = await this.generatePackingNumber();
    const packer = userId ? await this.em.findOne(User, { id: userId }) : null;

    const packing = this.packingRepo.create({
      tenant,
      picking,
      packingNumber,
      status: PackingStatus.IN_PROGRESS,
      packer: packer ?? undefined,
      startedAt: new Date(),
    } as unknown as Packing);

    await this.em.persistAndFlush(packing);
    return packing;
  }

  /**
   * Create a new box on a packing, attaching the given PickingLines.
   * Each line may only belong to one box per packing.
   */
  async createBox(
    packingId: string,
    pickingLineIds: string[],
    weightKg?: number,
    dimensionsCm?: string,
  ): Promise<PackingBox> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const packing = await this.packingRepo.findOne(
      { id: packingId },
      { populate: ['picking', 'boxes'] as never[] },
    );
    if (!packing) throw new PackingNotFoundException(packingId);
    if (packing.status !== PackingStatus.IN_PROGRESS) {
      throw new PackingNotInProgressException(packingId, packing.status);
    }

    const lines = await this.pickingLineRepo.find(
      { id: { $in: pickingLineIds } },
      { populate: ['picking'] as never[] },
    );

    const existingBoxes = await this.boxRepo.find(
      { packing: packing.id },
      { populate: ['items'] as never[] },
    );
    const boxedLineIndex = new Map<string, string>(); // lineId → boxId
    for (const b of existingBoxes) {
      for (const item of b.items.getItems()) {
        boxedLineIndex.set(item.id, b.id);
      }
    }

    for (const line of lines) {
      if (line.picking.id !== packing.picking.id) {
        throw new PickingLineNotInPickingException(line.id, packing.picking.id);
      }
      const existingBoxId = boxedLineIndex.get(line.id);
      if (existingBoxId) {
        throw new PickingLineAlreadyBoxedException(line.id, existingBoxId);
      }
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const nextBoxNumber = packing.boxes.length + 1;
    const barcode = this.buildBoxBarcode(packing.packingNumber, nextBoxNumber);

    const box = this.boxRepo.create({
      tenant,
      packing,
      boxNumber: nextBoxNumber,
      barcode,
      weightKg,
      dimensionsCm,
    } as unknown as PackingBox);
    for (const line of lines) box.items.add(line);

    await this.em.persistAndFlush(box);
    return box;
  }

  /**
   * Remove a box. Releases its picking-line links so the operator can
   * re-pack them into a different carton.
   */
  async removeBox(boxId: string): Promise<void> {
    const box = await this.boxRepo.findOne(
      { id: boxId },
      { populate: ['packing'] as never[] },
    );
    if (!box) throw new PackingBoxNotFoundException(boxId);
    if (box.packing.status !== PackingStatus.IN_PROGRESS) {
      throw new PackingNotInProgressException(
        box.packing.id,
        box.packing.status,
      );
    }
    await this.em.removeAndFlush(box);
  }

  /**
   * Complete a packing. Requires every PickingLine to be boxed.
   * Transitions the SalesOrder to READY_FOR_SHIPMENT.
   */
  async completePacking(packingId: string): Promise<Packing> {
    const packing = await this.packingRepo.findOne(
      { id: packingId },
      { populate: ['picking', 'picking.salesOrder'] as never[] },
    );
    if (!packing) throw new PackingNotFoundException(packingId);
    if (packing.status !== PackingStatus.IN_PROGRESS) {
      throw new PackingNotInProgressException(packingId, packing.status);
    }

    const totalLines = await this.pickingLineRepo.count({
      picking: packing.picking.id,
    });
    const boxes = await this.boxRepo.find(
      { packing: packing.id },
      { populate: ['items'] as never[] },
    );
    const boxedLineIds = new Set<string>();
    for (const b of boxes) {
      for (const item of b.items.getItems()) {
        boxedLineIds.add(item.id);
      }
    }
    if (boxedLineIds.size < totalLines) {
      throw new PackingNotInProgressException(
        packingId,
        `${totalLines - boxedLineIds.size} lines not yet boxed`,
      );
    }

    packing.status = PackingStatus.COMPLETED;
    packing.completedAt = new Date();

    const so = await this.soRepo.findOneOrFail({
      id: packing.picking.salesOrder.id,
    });
    so.workflowStatus = SalesOrderStatus.READY_FOR_SHIPMENT;

    await this.em.flush();
    return packing;
  }

  private buildBoxBarcode(packingNumber: string, boxNumber: number): string {
    return `${packingNumber}-B${String(boxNumber).padStart(3, '0')}`;
  }

  private async generatePackingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PK-PACK-${year}-`;
    const last = await this.packingRepo.findOne(
      { packingNumber: { $like: `${prefix}%` } },
      { orderBy: { packingNumber: 'DESC' } },
    );
    const nextSeq = last
      ? parseInt(last.packingNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
}
