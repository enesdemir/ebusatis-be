import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../modules/orders/entities/sales-order.entity';
import { SalesOrderLine } from '../modules/orders/entities/sales-order-line.entity';
import {
  OrderRollAllocation,
  AllocationStatus,
} from '../modules/orders/entities/order-roll-allocation.entity';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../modules/inventory/entities/inventory-item.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * AllocationDemoSeeder (Sprint 17).
 *
 * Picks the ALLOCATED demo SO from SalesOrderSampleSeeder and
 * allocates the oldest available inventory items for each line.
 * Simulates the FIFO outcome + one CUT allocation to showcase the
 * split-roll parent/child kartela chain in the UI.
 *
 * Idempotent: skips if the SO already has allocations.
 */
export class AllocationDemoSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });

      const so = await em.findOne(
        SalesOrder,
        {
          tenant: tenant.id,
          orderNumber: 'SO-DEMO-0003',
          workflowStatus: SalesOrderStatus.ALLOCATED,
        },
        { filters: false },
      );
      if (!so) continue;

      const existing = await em.findOne(
        OrderRollAllocation,
        { tenant: tenant.id, orderLine: { order: so.id } },
        { filters: false },
      );
      if (existing) continue;

      const lines = await em.find(
        SalesOrderLine,
        { tenant: tenant.id, order: so.id },
        { filters: false, populate: ['variant'] as never[] },
      );

      for (const line of lines) {
        const rolls = await em.find(
          InventoryItem,
          {
            tenant: tenant.id,
            variant: line.variant.id,
            status: {
              $in: [
                InventoryItemStatus.IN_STOCK,
                InventoryItemStatus.FULL,
                InventoryItemStatus.PARTIAL,
              ],
            },
          },
          {
            filters: false,
            orderBy: { receivedAt: 'ASC', createdAt: 'ASC' },
            limit: 3,
          },
        );
        if (rolls.length === 0) continue;

        let remaining = Number(line.requestedQuantity);
        for (let i = 0; i < rolls.length && remaining > 0; i++) {
          const roll = rolls[i];
          const available =
            Number(roll.currentQuantity) - Number(roll.reservedQuantity);
          if (available <= 0) continue;
          const take = Math.min(available, remaining);
          roll.reservedQuantity = Number(roll.reservedQuantity) + take;

          const alloc = em.create(OrderRollAllocation, {
            tenant,
            orderLine: line,
            roll,
            allocatedQuantity: take,
            status:
              i === rolls.length - 1 || remaining - take < available
                ? AllocationStatus.CUT
                : AllocationStatus.RESERVED,
            cutAt:
              i === rolls.length - 1 || remaining - take < available
                ? new Date()
                : undefined,
          } as unknown as OrderRollAllocation);
          em.persist(alloc);
          remaining -= take;
        }
      }
    }

    await em.flush();
  }
}
