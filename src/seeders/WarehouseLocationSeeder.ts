import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  WarehouseLocation,
  LocationType,
} from '../modules/definitions/entities/warehouse-location.entity';
import { Warehouse } from '../modules/definitions/entities/warehouse.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * WarehouseLocationSeeder (Sprint 17).
 *
 * Builds a three-level hierarchy for every tenant's first warehouse:
 *   Floor (FLOOR) → Aisle (AISLE) × 2 → Shelf (SHELF) × 5
 *
 * Capacity is metadata only (maxRolls, maxWeight) — actual occupancy
 * is computed from InventoryItem.location counts by the service layer.
 *
 * Idempotent: upsert by `(warehouse, code)`.
 */
export class WarehouseLocationSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });
      const warehouses = await em.find(
        Warehouse,
        { tenant: tenant.id },
        { filters: false, limit: 1 },
      );
      if (warehouses.length === 0) continue;
      const warehouse = warehouses[0];

      // Root floor
      const floor = await this.upsert(em, tenant, warehouse, {
        code: 'K1',
        name: 'Kat 1',
        type: LocationType.FLOOR,
        capacity: { maxRolls: 1000, maxWeight: 50000 },
      });

      for (let a = 1; a <= 2; a++) {
        const aisle = await this.upsert(em, tenant, warehouse, {
          code: `K1-A${a}`,
          name: `Aisle A${a}`,
          type: LocationType.AISLE,
          parent: floor,
          capacity: { maxRolls: 400, maxWeight: 20000 },
        });

        for (let s = 1; s <= 5; s++) {
          await this.upsert(em, tenant, warehouse, {
            code: `K1-A${a}-S${s}`,
            name: `Shelf A${a}-S${s}`,
            type: LocationType.SHELF,
            parent: aisle,
            capacity: { maxRolls: 80, maxWeight: 4000 },
          });
        }
      }
    }

    await em.flush();
  }

  private async upsert(
    em: EntityManager,
    tenant: Tenant,
    warehouse: Warehouse,
    spec: {
      code: string;
      name: string;
      type: LocationType;
      parent?: WarehouseLocation;
      capacity?: Record<string, number>;
    },
  ): Promise<WarehouseLocation> {
    const existing = await em.findOne(
      WarehouseLocation,
      { tenant: tenant.id, warehouse: warehouse.id, code: spec.code },
      { filters: false },
    );
    if (existing) return existing;

    const loc = em.create(WarehouseLocation, {
      tenant,
      warehouse,
      code: spec.code,
      name: spec.name,
      type: spec.type,
      parent: spec.parent,
      capacity: spec.capacity,
    } as unknown as WarehouseLocation);
    em.persist(loc);
    return loc;
  }
}
