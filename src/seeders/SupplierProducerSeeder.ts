import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import {
  Partner,
  PartnerType,
} from '../modules/partners/entities/partner.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * SupplierProducerSeeder (Sprint 17).
 *
 * Issues a 90-day supplier portal token for the first SUPPLIER
 * partner in every tenant and logs the URL to stdout so operators
 * can copy it into a browser / admin panel for demo.
 *
 * Uses a local JwtService instance (same shape as SupplierPortalTokenService
 * but without Nest DI because seeders run outside the request lifecycle).
 * The JWT_SECRET env var must be set — falls back to 'secretKey' like
 * the auth module default.
 */
export class SupplierProducerSeeder extends Seeder {
  private readonly logger = new Logger(SupplierProducerSeeder.name);

  async run(em: EntityManager): Promise<void> {
    const jwt = new JwtService({
      secret: process.env.JWT_SECRET ?? 'secretKey',
    });
    const publicBaseUrl =
      process.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173';

    const tenants = await em.find(Tenant, {}, { filters: false });
    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });
      const supplier = await em.findOne(
        Partner,
        {
          tenant: tenant.id,
          types: { $contains: [PartnerType.SUPPLIER] },
        },
        { filters: false },
      );
      if (!supplier) continue;

      const token = jwt.sign(
        {
          sub: supplier.id,
          tenantId: tenant.id,
          email: supplier.email,
          kind: 'supplier-portal',
        },
        { expiresIn: '90d' },
      );
      const url = `${publicBaseUrl.replace(/\/$/, '')}/supplier/track/${token}`;
      this.logger.log(
        `Supplier portal token — tenant=${tenant.name} supplier=${supplier.name}`,
      );
      this.logger.log(url);
    }
  }
}
