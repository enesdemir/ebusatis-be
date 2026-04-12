import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  InventoryCount,
  CountStatus,
  CountType,
} from '../entities/inventory-count.entity';
import { InventoryCountLine } from '../entities/inventory-count-line.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
} from '../../../common/errors/app.exceptions';

/**
 * InventoryCountService (Sprint 14).
 *
 * Manages a cycle / annual / spot stock count. Lines are added one
 * by one during counting; on complete() we compute per-line variance
 * and — on reconcile() — push the variance into the corresponding
 * InventoryItem.currentQuantity as the final adjustment.
 */
@Injectable()
export class InventoryCountService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(InventoryCount)
    private readonly countRepo: EntityRepository<InventoryCount>,
    @InjectRepository(InventoryCountLine)
    private readonly lineRepo: EntityRepository<InventoryCountLine>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: EntityRepository<InventoryItem>,
  ) {}

  list() {
    return this.countRepo.findAll({
      populate: ['warehouse', 'createdBy'] as never[],
      orderBy: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const c = await this.countRepo.findOne(
      { id },
      { populate: ['lines', 'lines.item', 'warehouse'] as never[] },
    );
    if (!c) throw new EntityNotFoundException('InventoryCount', id);
    return c;
  }

  async start(
    data: { warehouseId: string; type: CountType; notes?: string },
    userId: string,
  ): Promise<InventoryCount> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const year = new Date().getFullYear();
    const prefix = `CNT-${year}-`;
    const last = await this.countRepo.findOne(
      { countNumber: { $like: `${prefix}%` } },
      { orderBy: { countNumber: 'DESC' } },
    );
    const nextSeq = last
      ? parseInt(last.countNumber.slice(prefix.length), 10) + 1
      : 1;
    const countNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    const count = this.countRepo.create({
      tenant,
      warehouse: this.em.getReference(Warehouse, data.warehouseId),
      type: data.type,
      countNumber,
      status: CountStatus.IN_PROGRESS,
      startedAt: new Date(),
      notes: data.notes,
      createdBy: this.em.getReference(User, userId),
    } as unknown as InventoryCount);
    await this.em.persistAndFlush(count);
    return count;
  }

  async addLine(
    countId: string,
    data: { itemId: string; actualQuantity: number; notes?: string },
  ): Promise<InventoryCountLine> {
    const count = await this.findById(countId);
    const item = await this.inventoryRepo.findOne({ id: data.itemId });
    if (!item) throw new EntityNotFoundException('InventoryItem', data.itemId);

    const expectedQuantity = Number(item.currentQuantity);
    const variance = data.actualQuantity - expectedQuantity;

    const line = this.lineRepo.create({
      tenant: count.tenant,
      count,
      item,
      expectedQuantity,
      actualQuantity: data.actualQuantity,
      variance,
      notes: data.notes,
    } as unknown as InventoryCountLine);
    await this.em.persistAndFlush(line);
    return line;
  }

  async complete(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    count.status = CountStatus.COMPLETED;
    count.completedAt = new Date();
    await this.em.flush();
    return count;
  }

  /**
   * Reconcile — apply every line's variance to its InventoryItem.
   * After reconcile, status = RECONCILED and the count becomes
   * read-only.
   */
  async reconcile(countId: string): Promise<InventoryCount> {
    const count = await this.findById(countId);
    const lines = await this.lineRepo.find(
      { count: countId },
      { populate: ['item'] as never[] },
    );
    for (const line of lines) {
      line.item.currentQuantity =
        Number(line.item.currentQuantity) + Number(line.variance);
    }
    count.status = CountStatus.RECONCILED;
    await this.em.flush();
    return count;
  }

  /**
   * Variance report: lines with non-zero variance, grouped by sign.
   */
  async varianceReport(countId: string) {
    const count = await this.findById(countId);
    const lines = await this.lineRepo.find(
      { count: countId, variance: { $ne: 0 } },
      { populate: ['item', 'item.variant'] as never[] },
    );
    return {
      count,
      surplus: lines.filter((l) => Number(l.variance) > 0),
      shortage: lines.filter((l) => Number(l.variance) < 0),
      totalSurplus: lines
        .filter((l) => Number(l.variance) > 0)
        .reduce((s, l) => s + Number(l.variance), 0),
      totalShortage: lines
        .filter((l) => Number(l.variance) < 0)
        .reduce((s, l) => s + Number(l.variance), 0),
    };
  }
}
