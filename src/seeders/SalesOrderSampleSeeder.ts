import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  SalesOrder,
  SalesOrderStatus,
  SalesOrderType,
  SalesOrderPaymentType,
} from '../modules/orders/entities/sales-order.entity';
import { SalesOrderLine } from '../modules/orders/entities/sales-order-line.entity';
import {
  Partner,
  PartnerType,
} from '../modules/partners/entities/partner.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { User } from '../modules/users/entities/user.entity';
import { Warehouse } from '../modules/definitions/entities/warehouse.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * SalesOrderSampleSeeder (Sprint 17).
 *
 * Creates five sample sales orders spanning the lifecycle:
 * DRAFT, PENDING_PAYMENT, ALLOCATED, SHIPPED, DELIVERED. These fuel
 * the Allocation / Pick / Pack / Ship demos and give the frontend
 * kanban/list views realistic data.
 *
 * Idempotent: skips if `orderNumber` already exists for the tenant.
 */
export class SalesOrderSampleSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });

      const customer = await em.findOne(
        Partner,
        {
          tenant: tenant.id,
          types: { $contains: [PartnerType.CUSTOMER] },
        },
        { filters: false },
      );
      const variants = await em.find(
        ProductVariant,
        { tenant: tenant.id },
        { filters: false, limit: 3 },
      );
      const warehouse = await em.findOne(
        Warehouse,
        { tenant: tenant.id },
        { filters: false },
      );
      const owner = await em.findOne(
        User,
        { tenant: tenant.id, isTenantOwner: true },
        { filters: false },
      );
      if (!customer || variants.length === 0 || !warehouse || !owner) continue;

      const specs: Array<{
        number: string;
        status: SalesOrderStatus;
        payment: SalesOrderPaymentType;
      }> = [
        {
          number: 'SO-DEMO-0001',
          status: SalesOrderStatus.DRAFT,
          payment: SalesOrderPaymentType.CASH,
        },
        {
          number: 'SO-DEMO-0002',
          status: SalesOrderStatus.PENDING_PAYMENT,
          payment: SalesOrderPaymentType.CASH,
        },
        {
          number: 'SO-DEMO-0003',
          status: SalesOrderStatus.ALLOCATED,
          payment: SalesOrderPaymentType.CREDIT,
        },
        {
          number: 'SO-DEMO-0004',
          status: SalesOrderStatus.SHIPPED,
          payment: SalesOrderPaymentType.CREDIT,
        },
        {
          number: 'SO-DEMO-0005',
          status: SalesOrderStatus.DELIVERED,
          payment: SalesOrderPaymentType.PARTIAL,
        },
      ];

      for (const spec of specs) {
        const existing = await em.findOne(
          SalesOrder,
          { tenant: tenant.id, orderNumber: spec.number },
          { filters: false },
        );
        if (existing) continue;

        const so = em.create(SalesOrder, {
          tenant,
          orderNumber: spec.number,
          orderType: SalesOrderType.FABRIC,
          paymentType: spec.payment,
          workflowStatus: spec.status,
          partner: customer,
          warehouse,
          orderDate: new Date(),
          totalAmount: 0,
          grandTotal: 0,
          createdBy: owner,
        } as unknown as SalesOrder);
        em.persist(so);

        let total = 0;
        variants.slice(0, 2).forEach((variant, idx) => {
          const qty = 20 + idx * 10;
          const unitPrice = 120;
          const lineTotal = qty * unitPrice;
          total += lineTotal;
          const line = em.create(SalesOrderLine, {
            tenant,
            order: so,
            lineNumber: idx + 1,
            variant,
            requestedQuantity: qty,
            unitPrice,
            lineTotal,
          } as unknown as SalesOrderLine);
          em.persist(line);
        });
        so.totalAmount = total;
        so.grandTotal = total;
      }
    }

    await em.flush();
  }
}
