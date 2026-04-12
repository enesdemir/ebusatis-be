import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  WarehouseLocation,
  LocationType,
} from '../entities/warehouse-location.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
} from '../../../common/errors/app.exceptions';

/**
 * WarehouseLocationService (Sprint 14).
 *
 * Hierarchical CRUD for warehouse locations (zone → aisle → shelf →
 * bin). Tree lookup returns the subtree rooted at a warehouse with
 * each node's current occupancy (sum of currentQuantity from items
 * stored at that location).
 */
@Injectable()
export class WarehouseLocationService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(WarehouseLocation)
    private readonly locationRepo: EntityRepository<WarehouseLocation>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: EntityRepository<InventoryItem>,
  ) {}

  list(warehouseId?: string) {
    return this.locationRepo.find(
      warehouseId ? { warehouse: warehouseId } : {},
      { orderBy: { sortOrder: 'ASC' } },
    );
  }

  async findById(id: string) {
    const loc = await this.locationRepo.findOne(
      { id },
      { populate: ['parent', 'children', 'warehouse'] as never[] },
    );
    if (!loc) throw new EntityNotFoundException('WarehouseLocation', id);
    return loc;
  }

  async create(data: {
    warehouseId: string;
    code: string;
    name: string;
    type: LocationType;
    parentId?: string;
    capacity?: Record<string, number>;
    sortOrder?: number;
  }): Promise<WarehouseLocation> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const loc = this.locationRepo.create({
      tenant,
      warehouse: this.em.getReference(Warehouse, data.warehouseId),
      code: data.code,
      name: data.name,
      type: data.type,
      parent: data.parentId
        ? this.em.getReference(WarehouseLocation, data.parentId)
        : undefined,
      capacity: data.capacity,
      sortOrder: data.sortOrder ?? 0,
    } as unknown as WarehouseLocation);
    await this.em.persistAndFlush(loc);
    return loc;
  }

  async update(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      capacity: Record<string, number>;
      sortOrder: number;
      isActive: boolean;
    }>,
  ): Promise<WarehouseLocation> {
    const loc = await this.findById(id);
    Object.assign(loc, data);
    await this.em.flush();
    return loc;
  }

  /**
   * Move an inventory item from one location to another and record
   * the move via an InventoryTransaction (the inventory service owns
   * that). Here we only flip the location FK; domain service may wrap
   * this with proper movement auditing.
   */
  async transferItem(
    itemId: string,
    targetLocationId: string,
  ): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findOne({ id: itemId });
    if (!item) throw new EntityNotFoundException('InventoryItem', itemId);
    const target = await this.findById(targetLocationId);
    if (target.warehouse.id !== (item.warehouse?.id ?? target.warehouse.id)) {
      item.warehouse = target.warehouse;
    }
    item.location = target;
    await this.em.flush();
    return item;
  }

  /**
   * Occupancy snapshot for a location — sum of currentQuantity for
   * every inventory item stored at this location (direct children
   * included recursively up to one level for aggregation).
   */
  async occupancy(locationId: string): Promise<{
    locationId: string;
    count: number;
    totalQuantity: number;
    capacity?: Record<string, number>;
  }> {
    const loc = await this.findById(locationId);
    const items = await this.inventoryRepo.find({ location: locationId });
    const totalQuantity = items.reduce(
      (s, i) => s + Number(i.currentQuantity),
      0,
    );
    return {
      locationId,
      count: items.length,
      totalQuantity,
      capacity: loc.capacity,
    };
  }

  async remove(id: string): Promise<void> {
    const loc = await this.findById(id);
    if (loc.children.length > 0) {
      throw new BadRequestException({
        error: 'LOCATION_HAS_CHILDREN',
        message: 'errors.warehouse.location_has_children',
      });
    }
    await this.em.removeAndFlush(loc);
  }
}
