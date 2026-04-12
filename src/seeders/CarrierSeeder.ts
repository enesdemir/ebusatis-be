import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  Partner,
  PartnerType,
  SupplierSubtype,
} from '../modules/partners/entities/partner.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * Seed three default Turkish domestic carrier partners per tenant.
 *
 * These Partner rows are what the outbound shipment flow attaches
 * to `Shipment.carrier`, and their `code` is what
 * CarrierApiService uses to resolve a provider adapter.
 *
 * Idempotent — looks up by `(tenant, code)` before inserting.
 */
export class CarrierSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    const carriers = [
      { code: 'ARAS', name: 'Aras Kargo' },
      { code: 'YURTICI', name: 'Yurtiçi Kargo' },
      { code: 'MNG', name: 'MNG Kargo' },
    ];

    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });
      for (const c of carriers) {
        const existing = await em.findOne(Partner, {
          tenant: tenant.id,
          code: c.code,
        });
        if (existing) continue;
        const partner = em.create(Partner, {
          tenant,
          name: c.name,
          code: c.code,
          types: [PartnerType.SUPPLIER],
          supplierSubtype: SupplierSubtype.LOGISTICS_PROVIDER,
        } as never);
        em.persist(partner);
      }
    }

    await em.flush();
  }
}
